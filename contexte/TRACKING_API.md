# Enrollment Service — API Tracking Parent

> Documentation dédiée au suivi de dossier côté **portail parent**.  
> Base URL (via gateway) : `http://localhost:8080/enrollment`  
> Aucun token JWT requis sur ces endpoints — accès sécurisé par `accessCode`.

---

## Vue d'ensemble

Le parent dispose de **3 modes de suivi** selon ce qu'il possède :

```
┌──────────────────────────────────────────────────────────────────┐
│  Le parent reçoit à la création du bundle :                      │
│    • bundleId   (UUID du dossier famille)                        │
│    • accessCode (code court ex: "A3F9")                         │
│    • reference  (ex: "FAM-2026-XYZ")                            │
│    • reference enfant (ex: "FAM-2026-XYZ-001")                  │
└──────────────┬───────────────────────────────────────────────────┘
               │
       ┌───────┴────────┬───────────────────┐
       ▼                ▼                   ▼
  Suivi bundle    Suivi 1 enfant      Retrouver par
  (famille)       (par référence)     email (perdu code)
```

---

## Endpoint 1 — Suivi du bundle famille (recommandé)

Retourne le dossier familial complet avec **tous les enfants** et leurs statuts.

```
GET /api/v1/public/admissions/bundles/{bundleId}?accessCode={code}
```

**Paramètres**

| Paramètre | Type | Où | Obligatoire | Description |
|---|---|---|---|---|
| `bundleId` | UUID | path | oui | ID du dossier famille |
| `accessCode` | string | query | oui | Code reçu à la création |

**Réponse 200 — `AdmissionBundleResponse`**

```json
{
  "id": "a7c75c8b-13a7-461a-b9a8-03b606c48e6f",
  "reference": "FAM-2026-XYZ",
  "accessCode": "A3F9",
  "status": "SUBMITTED",
  "family": {
    "primaryGuardian": {
      "firstName": "Mamadou",
      "lastName": "Diallo",
      "phone": "+224620000000",
      "email": "mamadou@example.com",
      "relation": "FATHER",
      "isFinancialResponsible": true,
      "customFields": {
        "profession": "Ingénieur",
        "address": "Conakry, Ratoma"
      }
    },
    "secondaryGuardian": null,
    "customFields": {
      "homeAddress": "Quartier Ratoma, Conakry"
    }
  },
  "admissions": [
    {
      "id": "uuid-enfant-1",
      "reference": "FAM-2026-XYZ-001",
      "type": "NEW_ENROLLMENT",
      "status": "SUBMITTED",
      "identity": {
        "firstName": "Boubacar",
        "lastName": "Diallo",
        "gender": "MALE",
        "birthDate": "2015-03-21",
        "birthPlace": "Conakry",
        "customFields": { "nationality": "Guinéenne" }
      },
      "documents": [
        {
          "code": "BIRTH_CERT",
          "name": "Acte de naissance",
          "mandatory": true,
          "status": "UPLOADED",
          "fileUrl": "https://storage/...",
          "preset": true
        },
        {
          "code": "REPORT_CARD",
          "name": "Bulletin scolaire",
          "mandatory": true,
          "status": "MISSING",
          "fileUrl": null,
          "preset": true
        }
      ],
      "trackerMessage": "Dossier soumis, en attente de vérification par le secrétariat.",
      "createdAt": "2026-04-18T10:00:00Z",
      "updatedAt": "2026-04-18T10:05:00Z"
    }
  ],
  "createdAt": "2026-04-18T10:00:00Z"
}
```

**Erreurs**

| Code | Raison |
|---|---|
| `400` | `bundleId` invalide ou `accessCode` incorrect → message `"Code d'accès familial invalide."` |
| `400` | Bundle introuvable → `"Dossier familial introuvable."` |

---

## Endpoint 2 — Suivi d'un enfant par référence

Retourne le statut d'**un seul enfant**, identifié par sa référence individuelle.

```
GET /api/v1/public/admissions/{reference}/track?accessCode={code}
```

**Paramètres**

| Paramètre | Type | Où | Obligatoire | Description |
|---|---|---|---|---|
| `reference` | string | path | oui | Référence de l'enfant (ex: `FAM-2026-XYZ-001`) |
| `accessCode` | string | query | oui | Code du bundle famille |

**Réponse 200 — `AdmissionResponse`**

```json
{
  "id": "uuid-enfant-1",
  "reference": "FAM-2026-XYZ-001",
  "type": "NEW_ENROLLMENT",
  "status": "VERIFIED",
  "identity": {
    "firstName": "Boubacar",
    "lastName": "Diallo",
    "gender": "MALE",
    "birthDate": "2015-03-21",
    "birthPlace": "Conakry",
    "customFields": { "nationality": "Guinéenne" }
  },
  "documents": [
    {
      "code": "BIRTH_CERT",
      "name": "Acte de naissance",
      "mandatory": true,
      "status": "UPLOADED",
      "fileUrl": "https://storage/...",
      "preset": true
    }
  ],
  "trackerMessage": "Dossier vérifié et conforme. Candidat autorisé à passer le test.",
  "createdAt": "2026-04-18T10:00:00Z",
  "updatedAt": "2026-04-18T11:00:00Z"
}
```

**Erreurs**

| Code | Raison |
|---|---|
| `400` | Référence introuvable → `"Dossier introuvable."` |
| `400` | `accessCode` incorrect → `"Code invalide."` |

---

## Endpoint 3 — Retrouver ses dossiers par email

Utile quand le parent a perdu son `accessCode` ou son `reference`. Retourne la liste de tous ses dossiers.

```
GET /api/v1/public/admissions/mine?email={email}
```

**Headers requis**

| Header | Description |
|---|---|
| `X-Tenant-Id` | UUID de l'école (slug ou UUID selon config gateway) |

**Paramètres**

| Paramètre | Type | Où | Obligatoire | Description |
|---|---|---|---|---|
| `email` | string | query | oui | Email du tuteur principal saisi à la création |

**Réponse 200 — `List<AdmissionResponse>`**

```json
[
  {
    "id": "uuid-enfant-1",
    "reference": "FAM-2026-XYZ-001",
    "type": "NEW_ENROLLMENT",
    "status": "ADMITTED",
    "identity": { "firstName": "Boubacar", "lastName": "Diallo", ... },
    "documents": [ ... ],
    "trackerMessage": "Candidat admis ! Merci de confirmer l'inscription sur votre portail.",
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

> **Limitation** : la recherche porte uniquement sur l'email du **tuteur principal**. Si le dossier a été créé avec un autre tuteur, il ne remontera pas.

**Erreurs**

| Code | Raison |
|---|---|
| `200 []` | Aucun dossier trouvé pour cet email (liste vide, pas d'erreur) |

---

## Référentiel des statuts et messages

| Valeur `status` | `trackerMessage` retourné | Signification pour le parent |
|---|---|---|
| `DRAFT` | Saisie en cours... | Dossier non encore soumis |
| `SUBMITTED` | Dossier soumis, en attente de vérification par le secrétariat. | En cours de traitement |
| `VERIFIED` | Dossier vérifié et conforme. Candidat autorisé à passer le test. | Documents OK, convocation à venir |
| `TESTING` | Évaluation pédagogique en cours. | Examen / entretien en cours |
| `ADMITTED` | Candidat admis ! Merci de confirmer l'inscription sur votre portail. | **Action parent requise** |
| `WAITLIST` | Candidat admis pédagogiquement. En attente d'une place disponible. | En attente de place |
| `VALIDATED` | Félicitations ! Admission validée définitivement. | Inscription confirmée |
| `REJECTED` | Désolé, le dossier n'a pas été retenu. | Dossier refusé |
| `CANCELLED` | Dossier annulé. | Annulé |

---

## Référentiel des types de documents (`DocumentStatus`)

| Valeur | Signification |
|---|---|
| `MISSING` | Document non fourni — à uploader |
| `PHYSICAL_RECEIVED` | Reçu physiquement au secrétariat |
| `UPLOADED` | Numérisé / uploadé en ligne |

---

## Schémas de données complets

### `AdmissionResponse` (suivi d'un enfant)

| Champ | Type | Nullable | Description |
|---|---|---|---|
| `id` | UUID | non | Identifiant interne de l'admission |
| `reference` | string | non | Référence unique lisible (ex: `FAM-2026-XYZ-001`) |
| `type` | enum | non | `NEW_ENROLLMENT` ou `RE_ENROLLMENT` |
| `status` | enum | non | Statut courant du dossier |
| `identity` | objet | non | Identité de l'enfant (voir ci-dessous) |
| `documents` | tableau | oui | Liste des documents requis et leur état |
| `trackerMessage` | string | non | Message lisible à afficher au parent |
| `createdAt` | ISO 8601 | non | Date de création |
| `updatedAt` | ISO 8601 | non | Dernière mise à jour |

### `IdentityPillar` (enfant)

| Champ | Type | Nullable | Description |
|---|---|---|---|
| `firstName` | string | non | Prénom |
| `lastName` | string | non | Nom de famille |
| `gender` | enum | non | `MALE` ou `FEMALE` |
| `birthDate` | date | non | Date de naissance (`YYYY-MM-DD`) |
| `birthPlace` | string | non | Lieu de naissance |
| `customFields` | objet | oui | Champs libres (ex: `nationality`) |

### `RequiredDocument`

| Champ | Type | Nullable | Description |
|---|---|---|---|
| `code` | string | non | Code technique (ex: `BIRTH_CERT`) |
| `name` | string | non | Libellé affiché au parent |
| `mandatory` | boolean | non | Obligatoire ou optionnel |
| `status` | enum | non | `MISSING` / `PHYSICAL_RECEIVED` / `UPLOADED` |
| `fileUrl` | string | oui | URL du fichier si uploadé |
| `preset` | boolean | non | `true` = défini par Feewi, `false` = ajouté par l'école |

### `AdmissionBundleResponse` (famille)

| Champ | Type | Nullable | Description |
|---|---|---|---|
| `id` | UUID | non | ID du bundle famille |
| `reference` | string | non | Référence famille (ex: `FAM-2026-XYZ`) |
| `accessCode` | string | oui | Code d'accès (à conserver côté frontend) |
| `status` | enum | non | Statut global du bundle |
| `family` | objet | non | Pilier famille (tuteurs, adresse) |
| `admissions` | tableau | non | Liste des dossiers enfants |
| `createdAt` | ISO 8601 | non | Date de création |

### `GuardianInfo` (tuteur)

| Champ | Type | Nullable | Description |
|---|---|---|---|
| `firstName` | string | non | Prénom |
| `lastName` | string | non | Nom |
| `phone` | string | non | Téléphone (format libre) |
| `email` | string | oui | Email |
| `relation` | enum | non | Lien de parenté (`FATHER`, `MOTHER`, `GUARDIAN`, ...) |
| `isFinancialResponsible` | boolean | non | Responsable financier |
| `customFields` | objet | oui | Champs libres (ex: `profession`, `address`) |

---

## Scénarios d'usage recommandés (frontend)

### Scénario A — Page de suivi classique

Le parent saisit sa **référence enfant** + **code d'accès** dans un formulaire :

```
GET /api/v1/public/admissions/{reference}/track?accessCode={code}
```

Afficher `trackerMessage` en titre + une barre de progression basée sur `status`.

---

### Scénario B — Portail famille complet

Le parent est connecté sur son espace personnel (bundle ID + code stockés en session/localStorage) :

```
GET /api/v1/public/admissions/bundles/{bundleId}?accessCode={code}
```

Afficher un onglet par enfant (chaque élément de `admissions[]`) avec son `status` et ses `documents`.

---

### Scénario C — Récupération de dossier perdu

Le parent a perdu son code, saisit son email dans un formulaire de recherche :

```
GET /api/v1/public/admissions/mine?email={email}
Header: X-Tenant-Id: {tenantId}
```

Afficher la liste des dossiers trouvés → le parent sélectionne le sien → rediriger vers le Scénario A ou B.

---

## Logique d'affichage suggérée

```
status === "ADMITTED"   → afficher un CTA "Confirmer mon inscription"
status === "VALIDATED"  → afficher badge vert "Admission confirmée"
status === "REJECTED"   → afficher message d'échec + lien contact école
status === "WAITLIST"   → afficher position si disponible + message d'attente
documents.some(d => d.mandatory && d.status === "MISSING")
                        → afficher alerte "Documents manquants"
```
