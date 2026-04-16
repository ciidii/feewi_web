# Référence API — Enrollment Service

**Version :** v2 (4-Pillars Model)  
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
├── assessment     : Assessment
└── trackerMessage : String   ← message lisible par le parent
```

### 1.3 En-têtes requis

| En-tête | Endpoints concernés | Valeur |
|---|---|---|
| `X-Tenant-Id` | Tous les endpoints publics | Identifiant de l'école |
| `Authorization` | Endpoints admin & direction | `Bearer <jwt>` |

---

## 2. Configuration du portail (Public)

Ces endpoints ne nécessitent **pas d'authentification** — appelés au chargement du portail.

### `GET /api/v1/public/config/summary`

Retourne l'état du portail et les années disponibles à l'inscription.

**En-tête :** `X-Tenant-Id: school-test`

**Réponse 200 :**
```json
{
  "tenantId": "school-test",
  "portalActive": true,
  "registrationMode": "PARENT_ONLY",
  "availableYears": [
    {
      "id": "3f2c4f13-24e3-475b-99f0-1d824f70347e",
      "label": "2025-2026",
      "registrationStartDate": "2026-01-15",
      "registrationEndDate": "2026-06-30",
      "active": true
    }
  ],
  "welcomeMessage": "Bienvenue sur le portail d'admission.",
  "legalText": "Règlement intérieur...",
  "enabledServices": ["CANTEEN", "TRANSPORT"],
  "levelStatuses": {
    "15b6532e-6703-4160-aee1-29fd10d9c52a": { "active": true, "full": false }
  }
}
```

> **Angular :** Appeler au démarrage. Si `portalActive: false`, afficher page de fermeture.

---

### `GET /api/v1/public/config/default`

Retourne le schéma de formulaire par défaut (champs à afficher, documents requis, etc.).

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
        { "name": "profession",  "label": "Profession",         "type": "TEXT", "mandatory": false },
        { "name": "address",     "label": "Adresse du domicile","type": "TEXT", "mandatory": false }
      ]
    },
    "medical": { "enabled": true, "customFields": [ ... ] },
    "schooling": { "enabled": true, "customFields": [ ... ] },
    "documents": {
      "enabled": true,
      "presetDocuments": [
        { "code": "BIRTH_CERT",  "name": "Extrait de naissance",  "mandatory": true  },
        { "code": "PHOTO",       "name": "Photo d'identité",       "mandatory": true  },
        { "code": "REPORT_CARD", "name": "Bulletins de notes",     "mandatory": false },
        { "code": "VACCINE_CARD","name": "Carnet de vaccination",  "mandatory": false }
      ]
    },
    "assessment": {
      "type": "DOSSIER",
      "subjects": {},
      "maxGrade": 20.0,
      "minPassingGrade": 10.0
    }
  },
  "documentChecklist": [ ... ],
  "assessmentConfig": { ... },
  "instructions": { "welcome": "Bienvenue..." },
  "enabledServices": ["CANTEEN"]
}
```

---

### `GET /api/v1/public/config/{levelId}`

Retourne la config effective pour un niveau spécifique (avec ses overrides éventuels).

> **Angular :** Appeler quand l'utilisateur sélectionne un niveau, pour mettre à jour la checklist documents affichée.

---

## 3. Portail Parent — Workflow Séquentiel

```
[Étape 1] POST /bundles              → Crée le dossier famille (bundle)
[Étape 2] POST /bundles/{id}/children → Ajoute un enfant (une fois par enfant)
[Étape 3] PATCH /{id}/pillars/{key}  → Remplit chaque pilier de l'enfant
[Étape 4] PATCH /bundles/{id}/pillars/pillar_family → Met à jour la famille si besoin
[Étape 5] POST /bundles/{id}/submit  → Soumet tous les dossiers du bundle
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

> **Validation :** `primaryGuardian.firstName`, `lastName`, `phone`, `relation` sont **obligatoires** (défaut config). Si manquants → `400 Bad Request`.

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
  "academicYearId": "3f2c4f13-24e3-475b-99f0-1d824f70347e",
  "levelId": "15b6532e-6703-4160-aee1-29fd10d9c52a"
}
```

**Valeurs spéciales :**
- `academicYearId: "current"` → résout automatiquement l'année scolaire active
- `filiereId: "TEMP"` → si la filière n'est pas encore sélectionnée (peut être mis à jour via pilier schooling)

**Valeurs de `type` :**
- `NEW_ENROLLMENT` → nouveau candidat
- `RE_ENROLLMENT` → réinscription (voir endpoint dédié)

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
    { "code": "REPORT_CARD", "name": "Bulletins de notes",    "mandatory": false, "status": "MISSING" },
    { "code": "VACCINE_CARD","name": "Carnet de vaccination", "mandatory": false, "status": "MISSING" }
  ],
  "trackerMessage": "Saisie en cours...",
  "createdAt": "2026-04-16T18:01:00Z"
}
```

> **Angular :** Stocker l'`id` de chaque enfant pour les PATCH suivants.

---

### ÉTAPE 3 — `PATCH /api/v1/public/admissions/{id}/pillars/{pillarKey}`

Met à jour un pilier de l'enfant. Endpoint **générique et dynamique** : le body est le JSON du pilier correspondant.

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
    "nationality": "Sénégalaise",
    "religion": "Musulman"
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
  "academicYearId": "3f2c4f13-24e3-475b-99f0-1d824f70347e",
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

**En-tête :** `X-Tenant-Id: school-test`

**Body :**
```json
{
  "primaryGuardian": {
    "firstName": "Modou",
    "lastName": "Faye",
    "email": "modou.faye@example.sn",
    "phone": "+221771234567",
    "relation": "FATHER",
    "financialResponsible": true,
    "customFields": {
      "profession": "Architecte Senior"
    }
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

### ÉTAPE 5 — `POST /api/v1/public/admissions/bundles/{bundleId}/submit`

Soumet **tous les enfants** du bundle en une seule requête. Chaque enfant passe de `DRAFT` à `SUBMITTED`.

**En-tête :** `X-Tenant-Id: school-test`  
**Body :** *(vide)*

**Réponse 200 :**
```json
{
  "id": "b1d5705c-...",
  "reference": "FAM-2026-A3F9C1",
  "status": "SUBMITTED",
  "admissions": [
    { "id": "...", "reference": "ADM-2026-...", "status": "SUBMITTED", "trackerMessage": "Dossier soumis, en attente de vérification." },
    { "id": "...", "reference": "ADM-2026-...", "status": "SUBMITTED", "trackerMessage": "Dossier soumis, en attente de vérification." }
  ]
}
```

> **Validation :** Si les champs core sont incomplets (prénom, nom, sexe, date/lieu de naissance, année scolaire, niveau) → `422 Unprocessable Entity`.

**Alternative — Soumettre un seul enfant :**

```
POST /api/v1/public/admissions/{id}/submit
```

---

### Upload de documents — `POST /api/v1/public/admissions/{id}/documents/{docCode}`

**Body :** `"https://storage.feewi.sn/documents/extrait-naissance.pdf"` *(string brut)*

**Codes de documents :**

| Code | Document |
|---|---|
| `BIRTH_CERT` | Extrait de naissance |
| `PHOTO` | Photo d'identité |
| `REPORT_CARD` | Bulletins de notes |
| `VACCINE_CARD` | Carnet de vaccination |

**Réponse :** `200 OK`

---

### Sélection de services — `PATCH /api/v1/public/admissions/{id}/subscriptions`

```json
[
  { "serviceCode": "CANTEEN",   "option": "FULL_DAY" },
  { "serviceCode": "TRANSPORT", "option": "MORNING_ONLY" }
]
```

**Réponse :** `204 No Content`

---

### Annuler un dossier — `POST /api/v1/public/admissions/{id}/cancel`

**Réponse :** `204 No Content`

---

### Réinscription élève existant — `POST /api/v1/public/admissions/re-enroll`

Pour les élèves déjà enregistrés dans le `student-registry-service`.

```json
{
  "tenantId": "school-test",
  "studentId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "academicYearId": "3f2c4f13-24e3-475b-99f0-1d824f70347e",
  "nextLevelId": "770e8400-e29b-411d-a716-446655440022"
}
```

**Réponse 201 :** `AdmissionResponse` avec `type: "RE_ENROLLMENT"` et identity pré-remplie depuis le registre.

---

## 4. Suivi du dossier (Parent)

### Récupérer le bundle complet — `GET /api/v1/public/admissions/bundles/{bundleId}?accessCode={code}`

Retourne le bundle avec tous ses enfants. Sécurisé par le code d'accès.

**Réponse 200 :** `AdmissionBundleResponse` complet.

---

### Suivre un dossier par référence — `GET /api/v1/public/admissions/{reference}/track?accessCode={code}`

**Exemple :** `GET /api/v1/public/admissions/ADM-2026-F4A1B2C3/track?accessCode=XK7M2P`

**Réponse 200 :**
```json
{
  "id": "7c3f8a21-...",
  "reference": "ADM-2026-F4A1B2C3",
  "status": "ADMITTED",
  "trackerMessage": "Candidat admis ! Merci de confirmer l'inscription sur votre portail.",
  "identity": { "firstName": "Moussa", "lastName": "Faye" },
  "documents": [ ... ]
}
```

---

### Lister tous les dossiers par email — `GET /api/v1/public/admissions/mine?email={email}`

**En-tête :** `X-Tenant-Id: school-test`

**Réponse 200 :** `AdmissionResponse[]`

---

## 5. Administration — Secrétariat

> **Auth :** `Authorization: Bearer <jwt>` requis.

### Lister les dossiers — `GET /api/v1/admin/admissions`

Recherche paginée avec filtres.

**Paramètres de requête :**

| Paramètre | Type | Description |
|---|---|---|
| `q` | string | Recherche textuelle (nom, référence) |
| `status` | enum | `DRAFT`, `SUBMITTED`, `VERIFIED`, ... |
| `levelId` | UUID | Filtrer par niveau |
| `academicYearId` | UUID | Filtrer par année scolaire |
| `channel` | enum | `DIGITAL`, `DIRECT` |
| `page` | int | Numéro de page (défaut: 0) |
| `size` | int | Taille de page (défaut: 20) |

**Réponse 200 :**
```json
{
  "content": [ { ...AdmissionAdminResponse... } ],
  "totalElements": 42,
  "totalPages": 3,
  "number": 0,
  "size": 20
}
```

---

### Détail d'un dossier — `GET /api/v1/admin/admissions/{id}/details`

Retourne le dossier complet incluant `primaryGuardian` résolu depuis le bundle.

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
    "firstName": "Moussa",
    "lastName": "Faye",
    "gender": "MALE",
    "birthDate": "2018-05-15",
    "birthPlace": "Dakar",
    "customFields": { "nationality": "Sénégalaise" }
  },
  "medical": {
    "customFields": { "bloodGroup": "O+", "criticalAllergies": "Arachides" }
  },
  "schooling": {
    "academicYearId": "3f2c4f13-...",
    "levelId": "15b6532e-...",
    "levelLabel": "CE1",
    "customFields": { "previousSchool": "École Sacré-Cœur" }
  },
  "primaryGuardian": {
    "firstName": "Modou",
    "lastName": "Faye",
    "phone": "+221771234567",
    "relation": "FATHER"
  },
  "documents": [
    { "code": "BIRTH_CERT", "name": "Extrait de naissance", "mandatory": true, "status": "UPLOADED", "fileUrl": "https://..." },
    { "code": "PHOTO",      "name": "Photo d'identité",      "mandatory": true, "status": "MISSING" }
  ],
  "assessment": null,
  "subscriptions": [],
  "createdAt": "2026-04-16T18:01:00Z",
  "updatedAt": "2026-04-16T18:30:00Z"
}
```

---

### Réception physique d'un document — `PATCH /api/v1/admin/admissions/{id}/documents/{docName}/receive`

Marque un document comme reçu physiquement au guichet.

**Réponse :** `204 No Content`

---

### Vérification conformité — `PATCH /api/v1/admin/admissions/{id}/verify`

Fait passer le dossier de `SUBMITTED` → `VERIFIED` (→ `TESTING` automatiquement si assessment configuré).

**Réponse :** `204 No Content`

---

### Évaluation pédagogique — `PATCH /api/v1/admin/admissions/{id}/assessment`

Saisit les notes. La moyenne et la décision sont **calculées automatiquement** par le serveur.

**Body :**
```json
{
  "grades": {
    "Français": 14.5,
    "Mathématiques": 16.0,
    "Anglais": 12.0
  },
  "comments": "Très bon profil, élève motivé.",
  "recommendedLevelId": "1c448a03-2450-4a5d-ab8f-4b03724c2f3d"
}
```

> `decision` et `averageGrade` ne sont **pas à envoyer** — calculés côté serveur selon les coefficients de la config.

**Réponse :** `204 No Content`

---

### Saisie directe au guichet — `POST /api/v1/admin/admissions/direct`

Crée et soumet un dossier en une seule opération (usage secrétariat/guichet).

**Body :**
```json
{
  "tenantId": "school-test",
  "type": "NEW_ENROLLMENT",
  "academicYearId": "3f2c4f13-24e3-475b-99f0-1d824f70347e",
  "levelId": "15b6532e-6703-4160-aee1-29fd10d9c52a",
  "identity": {
    "firstName": "Samba",
    "lastName": "Diop",
    "gender": "MALE",
    "birthDate": "2016-08-20",
    "birthPlace": "Saint-Louis",
    "customFields": { "nationality": "Sénégalaise" }
  },
  "primaryGuardian": {
    "firstName": "Abdou",
    "lastName": "Diop",
    "phone": "+221709876543",
    "relation": "FATHER",
    "financialResponsible": true,
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

### Valider un dossier — `PATCH /api/v1/admin/direction/admissions/{id}/validate`

`ADMITTED` → `VALIDATED`. Déclenche l'événement `ADMISSION_VALIDATED` (création élève dans student-registry).

**Réponse 200 :** `AdmissionAdminResponse` mis à jour.

---

### Outrepasser (Valider sans test) — `PATCH /api/v1/admin/direction/admissions/{id}/overrule`

Valide directement sans passer par l'évaluation pédagogique.

**Réponse 200 :** `AdmissionAdminResponse`

---

### Rejeter — `PATCH /api/v1/admin/direction/admissions/{id}/reject`

**Body :** `"Niveau insuffisant pour l'année demandée."` *(string brut)*

**Réponse :** `204 No Content`

---

### Mettre en liste d'attente — `PATCH /api/v1/admin/direction/admissions/{id}/waitlist`

**Réponse :** `204 No Content`

---

### Validation en masse — `POST /api/v1/admin/direction/admissions/bulk-validate`

**Body :**
```json
[
  "7c3f8a21-dd4e-4b9f-9e12-abc123def456",
  "9d4e7b32-ee5f-5c0g-af23-bcd234efg567"
]
```

**Réponse 200 :** `AdmissionAdminResponse[]`

---

## 7. Configuration Établissement (Admin)

> **Auth :** `Authorization: Bearer <jwt>` avec rôle `DIRECTION`.

### Lire la config — `GET /api/v1/admin/config`

Retourne la configuration complète de l'établissement (opérationnelle + schéma).

**Réponse 200 :** `EnrollmentConfig` complet.

---

### Mettre à jour la config — `PUT /api/v1/admin/config`

Met à jour le schéma et les paramètres de configuration. Les champs `null` sont ignorés (merge partiel).

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
    "family": {
      "enabled": true,
      "allowedWithoutGuardian": false,
      "guardianCustomFields": [
        { "name": "profession",  "label": "Profession",  "type": "TEXT", "mandatory": false },
        { "name": "address",     "label": "Domicile",    "type": "TEXT", "mandatory": false }
      ]
    },
    "medical": { "enabled": true, "customFields": [] },
    "schooling": {
      "customFields": [
        { "name": "previousSchool", "label": "École précédente", "type": "TEXT", "mandatory": false }
      ]
    },
    "documents": {
      "presetDocuments": [
        { "code": "BIRTH_CERT",  "name": "Extrait de Naissance", "mandatory": true  },
        { "code": "PHOTO",       "name": "Photo d'identité",      "mandatory": true  },
        { "code": "VACCINE_CARD","name": "Carnet de vaccination", "mandatory": false }
      ]
    },
    "assessment": {
      "type": "EXAM",
      "subjects": { "Français": 2, "Mathématiques": 3, "Anglais": 1 },
      "maxGrade": 20.0,
      "minPassingGrade": 10.0
    }
  },
  "instructions": {
    "welcome": "Bienvenue sur le portail d'admission de l'établissement."
  },
  "legalText": "Règlement intérieur...",
  "enabledServices": ["CANTEEN", "TRANSPORT"]
}
```

**Réponse :** `204 No Content`

---

### Ouvrir/fermer le portail — `PATCH /api/v1/admin/config/portal-status?active={true|false}`

**Réponse :** `204 No Content`

---

### Override par niveau — `PATCH /api/v1/admin/config/level-overrides/{levelId}`

Configure une checklist et/ou une évaluation spécifique à un niveau.

**Body :**
```json
{
  "active": true,
  "maxNewEnrollments": 30,
  "documentChecklist": [
    { "code": "BIRTH_CERT", "name": "Extrait de naissance", "mandatory": true },
    { "code": "BUL_6EME",   "name": "Bulletin 6ème",        "mandatory": true }
  ],
  "assessmentConfig": {
    "type": "EXAM",
    "subjects": {
      "Français":      2,
      "Calcul":        3,
      "Anglais":       1
    },
    "maxGrade": 20.0,
    "minPassingGrade": 12.0
  }
}
```

**Réponse :** `204 No Content`

---

### Réinitialiser la config — `POST /api/v1/admin/config/reset`

Remet la config aux valeurs par défaut de Feewi.

**Réponse :** `200 OK`

---

## 8. Codes HTTP & Erreurs

| Code | Signification | Cas typiques |
|---|---|---|
| `200 OK` | Succès avec corps | GET, PATCH validation, submit |
| `201 Created` | Ressource créée | POST bundle, POST children, POST direct |
| `204 No Content` | Succès sans corps | PATCH piliers, PATCH config |
| `400 Bad Request` | Données invalides | Enum inconnu, format UUID invalide |
| `401 Unauthorized` | Token absent | Endpoint admin sans JWT |
| `403 Forbidden` | Rôle insuffisant | Direction endpoint avec rôle SECRETARIAT |
| `404 Not Found` | Ressource introuvable | ID ou référence inexistant |
| `422 Unprocessable Entity` | Règle métier violée | Soumission avec champs core manquants, note > maxGrade |
| `500 Internal Server Error` | Erreur serveur | Service distant injoignable (loggué) |

**Format d'erreur standard :**
```json
{
  "timestamp": "2026-04-16T18:00:00Z",
  "status": 422,
  "error": "Unprocessable Entity",
  "message": "La date de naissance est obligatoire.",
  "path": "/api/v1/public/admissions/7c3f8a21-.../submit"
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

## Annexe — Enums

```typescript
// AdmissionType
type AdmissionType = 'NEW_ENROLLMENT' | 'RE_ENROLLMENT';

// AdmissionStatus
type AdmissionStatus = 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'TESTING'
                     | 'ADMITTED' | 'WAITLIST' | 'VALIDATED' | 'REJECTED' | 'CANCELLED';

// AdmissionChannel
type AdmissionChannel = 'DIGITAL' | 'DIRECT';

// Gender
type Gender = 'MALE' | 'FEMALE';

// GuardianRelation
type GuardianRelation = 'FATHER' | 'MOTHER' | 'UNCLE' | 'AUNT' | 'GRANDPARENT' | 'GUARDIAN' | 'OTHER';

// RegistrationMode
type RegistrationMode = 'PARENT_ONLY' | 'ADMIN_ONLY' | 'BOTH';

// AssessmentType
type AssessmentType = 'DOSSIER' | 'EXAM' | 'INTERVIEW' | 'MIXED';

// AssessmentDecision
type AssessmentDecision = 'ADMITTED' | 'ADMITTED_WITH_RESERVE' | 'REJECTED';

// DocumentStatus
type DocumentStatus = 'MISSING' | 'UPLOADED' | 'RECEIVED' | 'VERIFIED' | 'REJECTED';

// FieldType
type FieldType = 'TEXT' | 'TEXTAREA' | 'DATE' | 'SELECT' | 'BOOLEAN' | 'NUMBER';
```

---

*Enrollment Service API Reference — v2 (4-Pillars Model) — Feewi © 2026*
