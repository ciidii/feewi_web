# Référence API — Enrollment Service

**Version :** v3 (4-Pillars Model + Overrides + Multi-Year)  
**Base URL (via Gateway) :** `http://localhost:8080/enrollment`  
**Dernière mise à jour :** Avril 2026

---

## Sommaire

1. [Architecture du modèle de données](#1-architecture-du-modèle-de-données)
2. [Configuration du portail (Public)](#2-configuration-du-portail-public)
3. [Portail Parent — Workflow Séquentiel](#3-portail-parent--workflow-séquentiel)
4. [Suivi du dossier (Parent)](#4-suivi-du-dossier-parent)
5. [Administration — Secrétariat](#5-administration--secrétariat)
6. [Administration — Direction](#6-administration--direction)
7. [Configuration Établissement (Admin)](#7-configuration-établissement-admin)
8. [Codes HTTP & Erreurs](#8-codes-http--erreurs)
9. [Statuts & Cycle de vie](#9-statuts--cycle-de-vie)
10. [Annexe — Enums TypeScript](#10-annexe--enums-typescript)

---

## 1. Architecture du modèle de données

### 1.1 Le modèle 4 Piliers

Chaque dossier d'admission est structuré autour de **4 piliers** :

| Pilier | Scope | Champs core (obligatoires Feewi) | Champs configurables |
|---|---|---|---|
| **Identity** | Par enfant | `firstName`, `lastName`, `gender`, `birthDate`, `birthPlace` | `nationality`, + champs école |
| **Medical** | Par enfant | *(aucun)* | `criticalAllergies`, `bloodGroup`, `emergencyContact*`, + champs école |
| **Schooling** | Par enfant | `academicYearId`, `levelId` | `filiereId`, `previousSchool`, + champs école |
| **Family** | Partagé bundle | `primaryGuardian.{firstName, lastName, phone, relation}` | `profession`, `homeAddress`, + champs école |

> Les champs configurables par l'école transitent via `customFields` (Map clé/valeur).

### 1.2 Structure Bundle / Admission

```
AdmissionBundle (Dossier Famille)
├── id             : UUID
├── reference      : "FAM-2026-XXXXXX"
├── accessCode     : "ABC123"   ← code de suivi donné au parent
├── status         : DRAFT | SUBMITTED | ...
├── family         : FamilyPillar   ← PARTAGÉ entre tous les enfants
└── admissions[]   : Admission[]    ← un par enfant

Admission (Dossier Enfant)
├── id             : UUID
├── reference      : "ADM-2026-XXXXXXXX"
├── bundleId       : UUID   ← lien vers le bundle
├── type           : NEW_ENROLLMENT | RE_ENROLLMENT
├── status         : DRAFT → SUBMITTED → VERIFIED → TESTING → ADMITTED → VALIDATED
├── identity       : IdentityPillar
├── medical        : MedicalPillar
├── schooling      : SchoolingPillar
├── documents[]    : RequiredDocument[]
├── subscriptions[]: ServiceSubscription[]   ← services parascolaires choisis
├── assessment     : Assessment
└── trackerMessage : String   ← message lisible par le parent
```

### 1.3 En-têtes requis

| En-tête | Endpoints concernés | Valeur |
|---|---|---|
| `X-Tenant-Id` | Tous les endpoints publics | Identifiant de l'école |
| `Authorization` | Endpoints admin & direction | `Bearer <jwt>` |

### 1.4 Hiérarchie de configuration

La configuration effective d'un niveau est résolue par fusion de 3 couches :

```
Base (schéma tenant)
    ↓  UNION docs/services  |  REPLACE assessment
Cycle Override  (ex: tous les niveaux du Lycée)
    ↓  UNION docs  |  REPLACE assessment/capacity
Level Override  (ex: spécifiquement la Terminale)
    ↓
Config effective
```

---

## 2. Configuration du portail (Public)

Ces endpoints ne nécessitent **pas d'authentification** — appelés au chargement du portail.

### `GET /api/v1/public/config/summary`

Retourne l'état du portail et **toutes les années ouvertes aux inscriptions aujourd'hui**.

**En-tête :** `X-Tenant-Id: school-test`

**Réponse 200 :**
```json
{
  "tenantId": "school-test",
  "portalActive": true,
  "legalText": "Règlement intérieur...",
  "availableYears": [
    {
      "id": "3f2c4f13-24e3-475b-99f0-1d824f70347e",
      "label": "Année scolaire 2025-2026",
      "state": "ACTIVE",
      "registrationStartDate": "2026-01-15",
      "registrationEndDate": "2026-03-31",
      "active": true,
      "allowedTypes": ["RE_ENROLLMENT"],
      "registrationMode": "ADMIN_ONLY",
      "welcomeMessage": "Ré-inscriptions tardives — contacter le secrétariat.",
      "levelStatuses": {
        "15b6532e-6703-4160-aee1-29fd10d9c52a": { "active": true,  "full": false },
        "aa3c9f21-1234-4abc-9012-fe9876543210": { "active": true,  "full": true  }
      }
    },
    {
      "id": "99a1b2c3-d4e5-6789-abcd-ef1234567890",
      "label": "Année scolaire 2026-2027",
      "state": "PLANNING",
      "registrationStartDate": "2026-03-01",
      "registrationEndDate": "2026-06-30",
      "active": true,
      "allowedTypes": ["NEW_ENROLLMENT", "RE_ENROLLMENT"],
      "registrationMode": "PARENT_ONLY",
      "welcomeMessage": "Pré-inscriptions pour 2026-2027 ouvertes !",
      "levelStatuses": {
        "15b6532e-6703-4160-aee1-29fd10d9c52a": { "active": true, "full": false }
      }
    }
  ]
}
```

> **Angular :**
> - Appeler au démarrage. Si `portalActive: false` → afficher page de fermeture.
> - Si `availableYears` est vide → afficher message "Inscriptions fermées".
> - Si plusieurs années → laisser le parent choisir.
> - Pour chaque année : respecter `allowedTypes` pour afficher/masquer les options NEW_ENROLLMENT / RE_ENROLLMENT.
> - `registrationMode: "ADMIN_ONLY"` → masquer le formulaire en ligne, afficher les coordonnées du secrétariat.

---

### `GET /api/v1/public/config/default`

Retourne le schéma de formulaire par défaut (champs à afficher, documents requis, services disponibles).

**En-tête :** `X-Tenant-Id: school-test`

**Réponse 200 :**
```json
{
  "portalActive": true,
  "registrationMode": "PARENT_ONLY",
  "schema": {
    "identity": {
      "coreFieldControls": {
        "firstName":  { "label": "Prénom" },
        "lastName":   { "label": "Nom de famille" },
        "gender":     { "label": "Sexe" },
        "birthDate":  { "label": "Date de naissance" },
        "birthPlace": { "label": "Lieu de naissance" }
      },
      "customFields": [
        { "name": "nationality", "label": "Nationalité", "type": "TEXT", "mandatory": false, "preset": true }
      ]
    },
    "family": {
      "enabled": true,
      "allowedWithoutGuardian": false,
      "guardianCoreFieldControls": {
        "firstName": { "label": "Prénom du responsable" },
        "lastName":  { "label": "Nom du responsable" },
        "phone":     { "label": "Téléphone" },
        "relation":  { "label": "Lien de parenté" }
      },
      "guardianCustomFields": [
        { "name": "profession", "label": "Profession",          "type": "TEXT", "mandatory": false, "preset": true },
        { "name": "address",    "label": "Adresse du domicile", "type": "TEXT", "mandatory": false, "preset": true }
      ]
    },
    "medical": {
      "enabled": true,
      "customFields": [
        { "name": "criticalAllergies",    "label": "Allergies connues",                "type": "TEXTAREA", "mandatory": false },
        { "name": "bloodGroup",           "label": "Groupe sanguin",                   "type": "SELECT",   "options": ["A+","A-","B+","B-","AB+","AB-","O+","O-"] },
        { "name": "emergencyContactName", "label": "Nom du contact d'urgence",         "type": "TEXT",     "mandatory": false },
        { "name": "emergencyContactPhone","label": "Téléphone du contact d'urgence",   "type": "TEXT",     "mandatory": false }
      ]
    },
    "schooling": {
      "coreFieldControls": {
        "academicYearId": { "label": "Année scolaire" },
        "levelId":        { "label": "Niveau demandé" }
      },
      "customFields": [
        { "name": "previousSchool", "label": "École de provenance", "type": "TEXT", "mandatory": false, "preset": true }
      ]
    },
    "documents": {
      "enabled": true,
      "presetDocuments": [
        { "code": "BIRTH_CERT",   "name": "Extrait de naissance",   "mandatory": true  },
        { "code": "PHOTO",        "name": "Photo d'identité",        "mandatory": true  },
        { "code": "REPORT_CARD",  "name": "Bulletins de notes",      "mandatory": false },
        { "code": "VACCINE_CARD", "name": "Carnet de vaccination",   "mandatory": false }
      ]
    },
    "assessment": {
      "type": "DOSSIER",
      "subjects": {},
      "maxGrade": 20.0,
      "minPassingGrade": 10.0
    },
    "services": {
      "enabled": true,
      "availableServices": [
        {
          "code": "CANTEEN",
          "label": "Cantine scolaire",
          "options": ["DEMI_PENSION", "PENSION_COMPLETE"],
          "mandatory": false,
          "preset": true
        },
        {
          "code": "TRANSPORT",
          "label": "Transport scolaire",
          "options": ["ALLER_SIMPLE", "ALLER_RETOUR"],
          "mandatory": false,
          "preset": true
        },
        {
          "code": "AFTER_SCHOOL_CARE",
          "label": "Garderie / Études surveillées",
          "options": [],
          "mandatory": false,
          "preset": true
        }
      ]
    }
  },
  "documentChecklist": [ "..." ],
  "assessmentConfig": { "..." },
  "instructions": { "welcome": "Bienvenue..." },
  "legalText": "Règlement intérieur..."
}
```

> **Angular :** Utiliser `schema.services.enabled` pour afficher/masquer le bloc services. Si `enabled: false`, ne pas afficher la section services au parent.

---

### `GET /api/v1/public/config/{levelId}`

Retourne la config effective pour un niveau spécifique après application des overrides cycle + level.

> **Angular :** Appeler quand l'utilisateur sélectionne un niveau, pour mettre à jour la checklist documents et les services affichés.

---

## 3. Portail Parent — Workflow Séquentiel

```
[Étape 1] POST /bundles                          → Crée le dossier famille (bundle)
[Étape 2] POST /bundles/{id}/children            → Ajoute un enfant (une fois par enfant)
[Étape 3] PATCH /{id}/pillars/{key}              → Remplit chaque pilier de l'enfant
[Étape 4] PATCH /bundles/{id}/pillars/pillar_family → Met à jour la famille si besoin
[Étape 5] PATCH /{id}/subscriptions              → Sélectionne les services (si activés)
[Étape 6] POST /bundles/{id}/submit              → Soumet tous les dossiers du bundle
```

---

### ÉTAPE 1 — `POST /api/v1/public/admissions/bundles`

Initialise l'espace familial. À appeler **une seule fois** par famille.

**En-tête :** `X-Tenant-Id: school-test`

**Body :**
```json
{
  "tenantId": "school-test",
  "family": {
    "primaryGuardian": {
      "firstName": "Modou",
      "lastName": "Faye",
      "email": "modou.faye@example.sn",
      "phone": "+221771234567",
      "relation": "FATHER",
      "financialResponsible": true,
      "customFields": {
        "profession": "Architecte"
      }
    },
    "customFields": {
      "homeAddress": "Almadies, Dakar"
    }
  }
}
```

**Réponse 201 :**
```json
{
  "id": "b1d5705c-f30c-456c-b66b-9e799a35328a",
  "reference": "FAM-2026-A3F9C1",
  "accessCode": "XK7M2P",
  "status": "DRAFT",
  "family": {
    "primaryGuardian": {
      "firstName": "Modou",
      "lastName": "Faye",
      "phone": "+221771234567",
      "relation": "FATHER",
      "financialResponsible": true,
      "customFields": { "profession": "Architecte" }
    },
    "customFields": { "homeAddress": "Almadies, Dakar" }
  },
  "admissions": [],
  "createdAt": "2026-04-16T18:00:00Z"
}
```

> **Angular :** Stocker `id` (bundleId) et `accessCode` en session/localStorage — ils serviront pour toute la suite.

---

### ÉTAPE 2 — `POST /api/v1/public/admissions/bundles/{bundleId}/children`

Ajoute un enfant au dossier familial. **Appeler une fois par enfant.**

**En-tête :** `X-Tenant-Id: school-test`

**Body :**
```json
{
  "firstName": "Moussa",
  "lastName": "Faye",
  "gender": "MALE",
  "type": "NEW_ENROLLMENT",
  "academicYearId": "99a1b2c3-d4e5-6789-abcd-ef1234567890",
  "levelId": "15b6532e-6703-4160-aee1-29fd10d9c52a",
  "cycleType": "PRIMARY"
}
```

**Champs :**

| Champ | Obligatoire | Description |
|---|---|---|
| `firstName`, `lastName`, `gender` | Oui | Identité de l'enfant |
| `type` | Oui | `NEW_ENROLLMENT` ou `RE_ENROLLMENT` |
| `academicYearId` | Oui | UUID de l'année, ou `"current"` pour l'année active |
| `levelId` | Oui | UUID du niveau, ou `"TEMP"` si non encore connu |
| `cycleType` | Non | Cycle du niveau — permet la résolution des overrides de cycle. Envoyer si connu : `MATERNAL`, `PRIMARY`, `MIDDLE_SCHOOL`, `HIGH_SCHOOL` |

> **Erreurs métier possibles :**
> - `422` — L'année est fermée aux inscriptions (`enrollmentOpen: false` ou hors fenêtre de dates)
> - `422` — Le type `NEW_ENROLLMENT` non autorisé pour cette année (`allowedTypes` configuré)

**Réponse 201 :**
```json
{
  "id": "7c3f8a21-dd4e-4b9f-9e12-abc123def456",
  "reference": "ADM-2026-F4A1B2C3",
  "status": "DRAFT",
  "type": "NEW_ENROLLMENT",
  "identity": {
    "firstName": "Moussa",
    "lastName": "Faye",
    "gender": "MALE"
  },
  "documents": [
    { "code": "BIRTH_CERT",  "name": "Extrait de naissance", "mandatory": true,  "status": "MISSING" },
    { "code": "PHOTO",       "name": "Photo d'identité",      "mandatory": true,  "status": "MISSING" },
    { "code": "REPORT_CARD", "name": "Bulletins de notes",    "mandatory": false, "status": "MISSING" }
  ],
  "trackerMessage": "Saisie en cours...",
  "createdAt": "2026-04-16T18:01:00Z"
}
```

> **Angular :** La checklist `documents[]` retournée est déjà résolue (base + cycle + level). Utiliser directement pour afficher la liste des pièces à fournir.

---

### ÉTAPE 3 — `PATCH /api/v1/public/admissions/{id}/pillars/{pillarKey}`

Met à jour un pilier de l'enfant. Endpoint **générique et dynamique**.

**En-tête :** `X-Tenant-Id: school-test`

#### Pilier Identité (`pillar_identity`)

```json
{
  "firstName": "Moussa",
  "lastName": "Faye",
  "gender": "MALE",
  "birthDate": "2018-05-15",
  "birthPlace": "Dakar",
  "customFields": {
    "nationality": "Sénégalaise"
  }
}
```

#### Pilier Médical (`pillar_medical`)

```json
{
  "customFields": {
    "criticalAllergies": "Arachides",
    "bloodGroup": "O+",
    "emergencyContactName": "Fatou Faye",
    "emergencyContactPhone": "+221771112233"
  }
}
```

#### Pilier Scolarité (`pillar_schooling`)

```json
{
  "academicYearId": "99a1b2c3-d4e5-6789-abcd-ef1234567890",
  "levelId": "15b6532e-6703-4160-aee1-29fd10d9c52a",
  "filiereId": null,
  "customFields": {
    "previousSchool": "École Élémentaire Sacré-Cœur"
  }
}
```

**Réponse :** `204 No Content`

---

### ÉTAPE 4 — `PATCH /api/v1/public/admissions/bundles/{bundleId}/pillars/pillar_family`

Met à jour les informations famille (partagées entre tous les enfants du bundle).

**Body :**
```json
{
  "primaryGuardian": {
    "firstName": "Modou",
    "lastName": "Faye",
    "phone": "+221771234567",
    "relation": "FATHER",
    "financialResponsible": true,
    "customFields": { "profession": "Architecte Senior" }
  },
  "secondaryGuardian": {
    "firstName": "Aminata",
    "lastName": "Faye",
    "phone": "+221771119988",
    "relation": "MOTHER",
    "financialResponsible": false
  },
  "customFields": {
    "homeAddress": "Almadies, Villa 12, Dakar"
  }
}
```

**Réponse :** `204 No Content`

---

### ÉTAPE 5 — `PATCH /api/v1/public/admissions/{id}/subscriptions`

Déclare les services parascolaires souhaités pour cet enfant.

> **Angular :** Afficher cette étape uniquement si `schema.services.enabled: true` dans la config. Proposer les services et options de `schema.services.availableServices`.

**Body :**
```json
[
  { "serviceCode": "CANTEEN",   "optionCode": "DEMI_PENSION"  },
  { "serviceCode": "TRANSPORT", "optionCode": "ALLER_RETOUR"  }
]
```

> Les `serviceCode` et `optionCode` doivent correspondre aux valeurs déclarées dans `schema.services.availableServices`. Valeurs invalides → `422`.

**Réponse :** `204 No Content`

---

### ÉTAPE 6 — `POST /api/v1/public/admissions/bundles/{bundleId}/submit`

Soumet **tous les enfants** du bundle. Chaque enfant passe de `DRAFT` à `SUBMITTED`.

**En-tête :** `X-Tenant-Id: school-test`  
**Body :** *(vide)*

**Réponse 200 :**
```json
{
  "id": "b1d5705c-...",
  "reference": "FAM-2026-A3F9C1",
  "status": "SUBMITTED",
  "admissions": [
    { "id": "...", "reference": "ADM-2026-...", "status": "SUBMITTED", "trackerMessage": "Dossier soumis, en attente de vérification." }
  ]
}
```

> **Validation :** Champs core manquants → `422 Unprocessable Entity`.

**Alternative — Soumettre un seul enfant :**
```
POST /api/v1/public/admissions/{id}/submit
```

---

### Upload de documents — `POST /api/v1/public/admissions/{id}/documents/{docCode}`

**Body :** `"https://storage.feewi.sn/documents/extrait-naissance.pdf"` *(string brut)*

**Réponse :** `200 OK`

---

### Annuler — `POST /api/v1/public/admissions/{id}/cancel`

**Réponse :** `204 No Content`

---

### Réinscription élève existant — `POST /api/v1/public/admissions/re-enroll`

Pour les élèves déjà enregistrés dans le `student-registry-service`.

```json
{
  "tenantId": "school-test",
  "studentId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "academicYearId": "99a1b2c3-d4e5-6789-abcd-ef1234567890",
  "nextLevelId": "770e8400-e29b-411d-a716-446655440022"
}
```

**Réponse 201 :** `AdmissionResponse` avec `type: "RE_ENROLLMENT"` et identity pré-remplie depuis le registre.

---

## 4. Suivi du dossier (Parent)

### `GET /api/v1/public/admissions/bundles/{bundleId}?accessCode={code}`

Retourne le bundle avec tous ses enfants. Sécurisé par le code d'accès.

**Réponse 200 :** `AdmissionBundleResponse` complet.

---

### `GET /api/v1/public/admissions/{reference}/track?accessCode={code}`

**Exemple :** `GET /api/v1/public/admissions/ADM-2026-F4A1B2C3/track?accessCode=XK7M2P`

**Réponse 200 :**
```json
{
  "id": "7c3f8a21-...",
  "reference": "ADM-2026-F4A1B2C3",
  "status": "ADMITTED",
  "trackerMessage": "Candidat admis ! Merci de confirmer l'inscription sur votre portail.",
  "identity": { "firstName": "Moussa", "lastName": "Faye" },
  "documents": [ "..." ]
}
```

---

### `GET /api/v1/public/admissions/mine?email={email}`

**En-tête :** `X-Tenant-Id: school-test`

**Réponse 200 :** `AdmissionResponse[]`

---

## 5. Administration — Secrétariat

> **Auth :** `Authorization: Bearer <jwt>` requis.

### Lister les dossiers — `GET /api/v1/admin/admissions`

| Paramètre | Type | Description |
|---|---|---|
| `q` | string | Recherche textuelle (nom, référence) |
| `status` | enum | `DRAFT`, `SUBMITTED`, `VERIFIED`, ... |
| `levelId` | UUID | Filtrer par niveau |
| `academicYearId` | UUID | Filtrer par année scolaire |
| `channel` | enum | `DIGITAL`, `DIRECT` |
| `page` | int | Numéro de page (défaut: 0) |
| `size` | int | Taille de page (défaut: 20) |

---

### Détail d'un dossier — `GET /api/v1/admin/admissions/{id}/details`

**Réponse 200 :**
```json
{
  "id": "7c3f8a21-...",
  "bundleId": "b1d5705c-...",
  "reference": "ADM-2026-F4A1B2C3",
  "type": "NEW_ENROLLMENT",
  "channel": "DIGITAL",
  "status": "SUBMITTED",
  "identity": {
    "firstName": "Moussa", "lastName": "Faye", "gender": "MALE",
    "birthDate": "2018-05-15", "birthPlace": "Dakar",
    "customFields": { "nationality": "Sénégalaise" }
  },
  "medical": { "customFields": { "bloodGroup": "O+", "criticalAllergies": "Arachides" } },
  "schooling": {
    "academicYearId": "99a1b2c3-...", "levelId": "15b6532e-...", "levelLabel": "CE1",
    "customFields": { "previousSchool": "École Sacré-Cœur" }
  },
  "primaryGuardian": {
    "firstName": "Modou", "lastName": "Faye", "phone": "+221771234567", "relation": "FATHER"
  },
  "documents": [
    { "code": "BIRTH_CERT", "name": "Extrait de naissance", "mandatory": true,  "status": "UPLOADED", "fileUrl": "https://..." },
    { "code": "PHOTO",      "name": "Photo d'identité",      "mandatory": true,  "status": "MISSING" }
  ],
  "subscriptions": [
    { "serviceCode": "CANTEEN", "optionCode": "DEMI_PENSION" }
  ],
  "assessment": null,
  "createdAt": "2026-04-16T18:01:00Z",
  "updatedAt": "2026-04-16T18:30:00Z"
}
```

---

### Réception physique d'un document — `PATCH /api/v1/admin/admissions/{id}/documents/{docName}/receive`

**Réponse :** `204 No Content`

---

### Vérification conformité — `PATCH /api/v1/admin/admissions/{id}/verify`

`SUBMITTED` → `VERIFIED` (→ `TESTING` automatiquement si assessment configuré).

**Réponse :** `204 No Content`

---

### Saisie directe au guichet — `POST /api/v1/admin/admissions/direct`

```json
{
  "tenantId": "school-test",
  "type": "NEW_ENROLLMENT",
  "academicYearId": "99a1b2c3-d4e5-6789-abcd-ef1234567890",
  "levelId": "15b6532e-6703-4160-aee1-29fd10d9c52a",
  "identity": {
    "firstName": "Samba", "lastName": "Diop", "gender": "MALE",
    "birthDate": "2016-08-20", "birthPlace": "Saint-Louis",
    "customFields": { "nationality": "Sénégalaise" }
  },
  "primaryGuardian": {
    "firstName": "Abdou", "lastName": "Diop", "phone": "+221709876543",
    "relation": "FATHER", "financialResponsible": true,
    "customFields": { "homeAddress": "Saint-Louis, Quartier Nord" }
  }
}
```

**Réponse 201 :** `AdmissionAdminResponse` avec `status: "SUBMITTED"` et `channel: "DIRECT"`.

---

### Annuler — `POST /api/v1/admin/admissions/{id}/cancel`

**Réponse :** `204 No Content`

---

## 6. Administration — Direction

> **Auth :** `Authorization: Bearer <jwt>` avec rôle `DIRECTION`.

### Évaluation pédagogique — `PATCH /api/v1/admin/admissions/{id}/assessment`

```json
{
  "grades": {
    "Français": 14.5,
    "Mathématiques": 16.0,
    "Anglais": 12.0
  },
  "comments": "Très bon profil.",
  "recommendedLevelId": "1c448a03-2450-4a5d-ab8f-4b03724c2f3d"
}
```

> `decision` et `averageGrade` sont **calculés côté serveur** selon les coefficients de la config. Ne pas les envoyer.

**Réponse :** `204 No Content`

---

### Valider — `PATCH /api/v1/admin/direction/admissions/{id}/validate`

`ADMITTED` → `VALIDATED`. Déclenche `ADMISSION_VALIDATED` (création élève dans student-registry).

**Réponse 200 :** `AdmissionAdminResponse`

---

### Outrepasser — `PATCH /api/v1/admin/direction/admissions/{id}/overrule`

Valide sans passer par l'évaluation pédagogique.

**Réponse 200 :** `AdmissionAdminResponse`

---

### Rejeter — `PATCH /api/v1/admin/direction/admissions/{id}/reject`

**Body :** `"Niveau insuffisant."` *(string brut)*

**Réponse :** `204 No Content`

---

### Liste d'attente — `PATCH /api/v1/admin/direction/admissions/{id}/waitlist`

**Réponse :** `204 No Content`

---

### Validation en masse — `POST /api/v1/admin/direction/admissions/bulk-validate`

**Body :** `["uuid1", "uuid2"]`

**Réponse 200 :** `AdmissionAdminResponse[]`

---

## 7. Configuration Établissement (Admin)

> **Auth :** `Authorization: Bearer <jwt>` avec rôle `DIRECTION`.

### Vue d'ensemble des endpoints de config

| Endpoint | Rôle |
|---|---|
| `GET    /api/v1/admin/config` | Lire la config complète |
| `PUT    /api/v1/admin/config` | Mettre à jour le schéma global |
| `PATCH  /api/v1/admin/config/portal-status?active=true\|false` | Ouvrir/fermer le portail |
| `POST   /api/v1/admin/config/reset` | Réinitialiser aux valeurs par défaut |
| `PUT    /api/v1/admin/config/year-overrides/{yearId}` | Configurer une année scolaire |
| `DELETE /api/v1/admin/config/year-overrides/{yearId}` | Supprimer l'override d'une année |
| `PUT    /api/v1/admin/config/cycle-overrides/{cycleType}` | Configurer un cycle scolaire |
| `DELETE /api/v1/admin/config/cycle-overrides/{cycleType}` | Supprimer l'override d'un cycle |
| `PATCH  /api/v1/admin/config/level-overrides/{levelId}` | Configurer un niveau scolaire |

---

### `GET /api/v1/admin/config`

Retourne la configuration complète de l'établissement.

**Réponse 200 :** `EnrollmentConfig` complet (voir structure ci-dessous).

---

### `PUT /api/v1/admin/config`

Met à jour le schéma global. Les champs `null` sont ignorés (merge partiel).

**Body :**
```json
{
  "registrationMode": "PARENT_ONLY",
  "schema": {
    "identity": {
      "customFields": [
        { "name": "nationality", "label": "Nationalité", "type": "TEXT", "mandatory": false }
      ]
    },
    "medical": { "enabled": true },
    "family": {
      "enabled": true,
      "allowedWithoutGuardian": false,
      "guardianCustomFields": [
        { "name": "profession", "label": "Profession", "type": "TEXT", "mandatory": false },
        { "name": "address",    "label": "Domicile",   "type": "TEXT", "mandatory": false }
      ]
    },
    "schooling": {
      "customFields": [
        { "name": "previousSchool", "label": "École précédente", "type": "TEXT", "mandatory": false }
      ]
    },
    "documents": {
      "presetDocuments": [
        { "code": "BIRTH_CERT",   "name": "Extrait de Naissance", "mandatory": true  },
        { "code": "PHOTO",        "name": "Photo d'identité",      "mandatory": true  },
        { "code": "VACCINE_CARD", "name": "Carnet de vaccination", "mandatory": false }
      ]
    },
    "assessment": {
      "type": "EXAM",
      "subjects": { "Français": 2, "Mathématiques": 3, "Anglais": 1 },
      "maxGrade": 20.0,
      "minPassingGrade": 10.0
    },
    "services": {
      "enabled": true,
      "availableServices": [
        { "code": "CANTEEN",   "label": "Cantine scolaire",   "options": ["DEMI_PENSION","PENSION_COMPLETE"], "mandatory": false },
        { "code": "TRANSPORT", "label": "Transport scolaire",  "options": ["ALLER_SIMPLE","ALLER_RETOUR"],    "mandatory": false }
      ]
    }
  },
  "instructions": {
    "welcome": "Bienvenue sur le portail d'admission."
  },
  "legalText": "Règlement intérieur..."
}
```

**Réponse :** `204 No Content`

---

### `PUT /api/v1/admin/config/year-overrides/{yearId}`

Configure les règles d'inscription pour une année scolaire spécifique.

> **Cas d'usage :**
> - Année `ACTIVE` : restreindre aux `RE_ENROLLMENT` uniquement
> - Année `PLANNING` : ouvrir les pré-inscriptions avec une fenêtre de dates
> - Fermer temporairement une année sans toucher au portail global

**Body :**
```json
{
  "enrollmentOpen": true,
  "openFrom": "2026-03-01",
  "openUntil": "2026-06-30",
  "allowedTypes": ["NEW_ENROLLMENT", "RE_ENROLLMENT"],
  "registrationMode": "PARENT_ONLY",
  "welcomeMessage": "Pré-inscriptions 2026-2027 ouvertes ! Inscrivez vos enfants dès maintenant."
}
```

| Champ | Obligatoire | Description |
|---|---|---|
| `enrollmentOpen` | Oui | `true` = inscriptions ouvertes, `false` = fermées manuellement |
| `openFrom` | Non | Date de début de la fenêtre (null = pas de limite) |
| `openUntil` | Non | Date de fin de la fenêtre (null = pas de limite) |
| `allowedTypes` | Non | Types autorisés. `null` = tous autorisés |
| `registrationMode` | Non | Surcharge le mode global pour cette année. `null` = hérite du global |
| `welcomeMessage` | Non | Message d'accueil spécifique à cette année. `null` = hérite du global |

**Réponse :** `204 No Content`

---

### `DELETE /api/v1/admin/config/year-overrides/{yearId}`

Supprime l'override — l'année revient au comportement ouvert par défaut.

**Réponse :** `204 No Content`

---

### `PUT /api/v1/admin/config/cycle-overrides/{cycleType}`

Configure les règles communes à tous les niveaux d'un cycle scolaire.

`cycleType` : `MATERNAL` | `PRIMARY` | `MIDDLE_SCHOOL` | `HIGH_SCHOOL`

> **Cas d'usage :**
> - Le lycée passe en mode EXAM avec des matières différentes
> - Le primaire a des documents supplémentaires
> - La garderie est disponible uniquement pour le préscolaire

**Body :**
```json
{
  "assessment": {
    "type": "EXAM",
    "subjects": { "Français": 2, "Mathématiques": 2, "SVT": 1 },
    "maxGrade": 20.0,
    "minPassingGrade": 12.0
  },
  "additionalDocuments": [
    { "code": "BREVET_NATIONAL", "name": "Brevet des collèges", "mandatory": true }
  ],
  "additionalServices": [
    { "code": "SPORT_CLUB", "label": "Club sportif", "options": ["FOOTBALL","BASKETBALL"], "mandatory": false }
  ]
}
```

| Champ | Stratégie | Description |
|---|---|---|
| `assessment` | REPLACE | Remplace l'assessment du schéma de base pour tout le cycle |
| `additionalDocuments` | UNION | Ajoutés EN PLUS des documents de base |
| `additionalServices` | UNION | Ajoutés EN PLUS des services de base |

**Réponse :** `204 No Content`

---

### `DELETE /api/v1/admin/config/cycle-overrides/{cycleType}`

Supprime l'override du cycle — revient au schéma de base.

**Réponse :** `204 No Content`

---

### `PATCH /api/v1/admin/config/level-overrides/{levelId}`

Configure les règles spécifiques à un niveau (granularité maximale).

> **Cas d'usage :**
> - La 6ème a ses propres matières d'évaluation
> - La Terminale a des documents supplémentaires (résultats du bac blanc)
> - Limiter les nouvelles inscriptions à 30 élèves en CE1

**Body :**
```json
{
  "active": true,
  "maxNewEnrollments": 30,
  "additionalDocuments": [
    { "code": "BAC_BLANC", "name": "Résultats bac blanc", "mandatory": true }
  ],
  "assessment": {
    "type": "EXAM",
    "subjects": { "Français": 3, "Mathématiques": 3, "Philosophie": 2 },
    "maxGrade": 20.0,
    "minPassingGrade": 12.0
  }
}
```

| Champ | Stratégie | Description |
|---|---|---|
| `active` | — | Ce niveau accepte-t-il des inscriptions ? |
| `maxNewEnrollments` | REPLACE | Capacité max pour ce niveau |
| `additionalDocuments` | UNION | Ajoutés EN PLUS de la base + cycle |
| `assessment` | REPLACE | Remplace l'assessment du cycle (ou de la base si pas de cycle) |

**Réponse :** `204 No Content`

---

### Exemple de config effective résolue — Terminale (HIGH_SCHOOL)

```
Base     → documents: [BIRTH_CERT, PHOTO]  assessment: DOSSIER
Cycle    → additionalDocuments: [BREVET_NATIONAL]  assessment: EXAM (Français×2, Maths×2)
Level    → additionalDocuments: [BAC_BLANC]  assessment: EXAM (Français×3, Maths×3, Philo×2)

Résultat → documents: [BIRTH_CERT, PHOTO, BREVET_NATIONAL, BAC_BLANC]
           assessment: EXAM (Français×3, Maths×3, Philo×2)  ← level gagne
```

---

### `PATCH /api/v1/admin/config/portal-status?active={true|false}`

Ouvre ou ferme le portail global (master switch).

**Réponse :** `204 No Content`

---

### `POST /api/v1/admin/config/reset`

Réinitialise la configuration complète aux valeurs par défaut de Feewi.

**Réponse :** `200 OK`

---

## 8. Codes HTTP & Erreurs

| Code | Signification | Cas typiques |
|---|---|---|
| `200 OK` | Succès avec corps | GET, validate, submit |
| `201 Created` | Ressource créée | POST bundle, POST children, POST direct |
| `204 No Content` | Succès sans corps | PATCH piliers, PATCH config, DELETE override |
| `400 Bad Request` | Données invalides | Enum inconnu, format UUID invalide |
| `401 Unauthorized` | Token absent | Endpoint admin sans JWT |
| `403 Forbidden` | Rôle insuffisant | Direction endpoint avec rôle SECRETARIAT |
| `404 Not Found` | Ressource introuvable | ID ou référence inexistant |
| `422 Unprocessable Entity` | Règle métier violée | Inscriptions fermées, type non autorisé, note > maxGrade, champs core manquants |
| `500 Internal Server Error` | Erreur serveur | Service distant injoignable |

**Format d'erreur standard :**
```json
{
  "timestamp": "2026-04-16T18:00:00Z",
  "status": 422,
  "error": "Unprocessable Entity",
  "message": "Le type d'inscription 'NEW_ENROLLMENT' n'est pas autorisé pour cette année scolaire.",
  "path": "/api/v1/public/admissions/bundles/b1d5705c-.../children"
}
```

---

## 9. Statuts & Cycle de vie

```
DRAFT
  │
  ▼ submit()
SUBMITTED
  │
  ▼ verify()  [Secrétariat]
VERIFIED ──────────────────────────────► CANCELLED (à tout moment)
  │
  ▼ startTesting() [auto si assessment configuré]
TESTING
  │
  ▼ assess()  [Direction]
  │
  ├──► ADMITTED    ──► validate()  ──► VALIDATED  ← état final ✓
  │
  ├──► WAITLIST    [liste d'attente]
  │
  └──► REJECTED    ← état final ✗
```

| Statut | `trackerMessage` affiché au parent |
|---|---|
| `DRAFT` | "Saisie en cours..." |
| `SUBMITTED` | "Dossier soumis, en attente de vérification par le secrétariat." |
| `VERIFIED` | "Dossier vérifié et conforme. Candidat autorisé à passer le test." |
| `TESTING` | "Évaluation pédagogique en cours." |
| `ADMITTED` | "Candidat admis ! Merci de confirmer l'inscription sur votre portail." |
| `WAITLIST` | "Candidat admis pédagogiquement. En attente d'une place disponible." |
| `VALIDATED` | "Félicitations ! Admission validée définitivement." |
| `REJECTED` | "Désolé, le dossier n'a pas été retenu." |
| `CANCELLED` | "Dossier annulé." |

---

## 10. Annexe — Enums TypeScript

```typescript
// AdmissionType
type AdmissionType = 'NEW_ENROLLMENT' | 'RE_ENROLLMENT';

// AdmissionStatus
type AdmissionStatus =
  | 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'TESTING'
  | 'ADMITTED' | 'WAITLIST' | 'VALIDATED' | 'REJECTED' | 'CANCELLED';

// AdmissionChannel
type AdmissionChannel = 'DIGITAL' | 'DIRECT';

// Gender
type Gender = 'MALE' | 'FEMALE';

// GuardianRelation
type GuardianRelation = 'FATHER' | 'MOTHER' | 'UNCLE' | 'AUNT' | 'GRANDPARENT' | 'GUARDIAN' | 'OTHER';

// RegistrationMode
type RegistrationMode = 'PARENT_ONLY' | 'ADMIN_ONLY' | 'BOTH';

// AcademicYearState — état de l'année dans academic-structure-service
type AcademicYearState = 'PLANNING' | 'ACTIVE' | 'CLOSED';

// CycleType — cycle scolaire pour les overrides de config
type CycleType = 'MATERNAL' | 'PRIMARY' | 'MIDDLE_SCHOOL' | 'HIGH_SCHOOL';

// AssessmentType
type AssessmentType = 'DOSSIER' | 'EXAM' | 'INTERVIEW' | 'MIXED';

// AssessmentDecision
type AssessmentDecision = 'ADMITTED' | 'ADMITTED_WITH_RESERVE' | 'REJECTED';

// DocumentStatus
type DocumentStatus = 'MISSING' | 'UPLOADED' | 'RECEIVED' | 'VERIFIED' | 'REJECTED';

// FieldType — type des champs configurables
type FieldType = 'TEXT' | 'TEXTAREA' | 'DATE' | 'SELECT' | 'BOOLEAN' | 'NUMBER';
```

---

*Enrollment Service API Reference — v3 (4-Pillars + Overrides + Multi-Year) — Feewi © 2026*
