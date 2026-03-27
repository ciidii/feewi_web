# Référence API : Enrollment Service (Admissions)

Ce document est le contrat d'interface technique exhaustif entre le Backend et les Frontends (Portail Parent, Administration, Mobile).

---

## 1. Principes d'Authentification & Headers

| Espace | Authentification | Headers Requis |
| :--- | :--- | :--- |
| **Portail Parent** | Publique (Anonyme) | `X-Tenant-Id: <ID_ECOLE>` |
| **Portail Admin** | Bearer Token (JWT) | `Authorization: Bearer <TOKEN>` |
| **Général** | Multi-tenancy | `X-Tenant-Id` (injecté par la Gateway pour l'Admin) |

---

## 2. API Publique (Portail Parent)
Base URL : `/enrollment/api/v1/public/applications`

### 2.1 Création d'un dossier (Initialisation)
*   **URL** : `POST /`
*   **Description** : Crée un nouveau dossier au statut `DRAFT`.
*   **Payload (`CreateApplicationRequest`)** :
    ```json
    {
      "tenantId": "string",
      "type": "NEW | RE_ENROLLMENT",
      "academicYearId": "uuid",
      "levelId": "uuid (optionnel)",
      "filiereId": "uuid (optionnel)",
      "primaryGuardian": {
        "firstName": "string",
        "lastName": "string",
        "email": "string",
        "phone": "string",
        "relation": "FATHER | MOTHER | GUARDIAN"
      }
    }
    ```
*   **Réponse** : `ApplicationResponse` (201 Created)

### 2.2 Réinscription simplifiée
*   **URL** : `POST /re-enroll`
*   **Description** : Initialise un dossier pré-rempli pour un élève déjà inscrit.
*   **Payload (`ReEnrollRequest`)** :
    ```json
    {
      "tenantId": "string",
      "studentId": "uuid",
      "academicYearId": "uuid",
      "nextLevelId": "uuid"
    }
    ```

### 2.3 Mise à jour du Candidat
*   **URL** : `PATCH /{id}/candidate`
*   **Payload (`CandidateRequest`)** :
    ```json
    {
      "info": {
        "firstName": "string",
        "lastName": "string",
        "gender": "MALE | FEMALE",
        "birthDate": "YYYY-MM-DD",
        "birthPlace": "string",
        "nationality": "string"
      },
      "levelId": "uuid",
      "filiereId": "uuid (optionnel)"
    }
    ```

### 2.4 Mise à jour du Responsable
*   **URL** : `PATCH /{id}/guardians`
*   **Payload** : `GuardianInfo` (voir section 5)

### 2.5 Gestion des Services (Cantine, Transport)
*   **URL** : `PATCH /{id}/subscriptions`
*   **Payload** : `List<ServiceSubscription>`
    ```json
    [
      { "serviceCode": "CANTEEN", "optionCode": "DEMI_PENSION" },
      { "serviceCode": "TRANSPORT", "optionCode": "ZONE_1" }
    ]
    ```

### 2.6 Téléchargement de Document
*   **URL** : `POST /{id}/documents/{docCode}`
*   **Body** : `String` (URL brute du fichier stocké)

### 2.7 Soumission & Annulation
*   **Soumettre** : `POST /{id}/submit` (Passe à `SUBMITTED`)
*   **Annuler** : `POST /{id}/cancel` (Passe à `CANCELLED`)

### 2.8 Suivi & Récupération
*   **Suivi Direct** : `GET /{reference}/track?accessCode={code}`
*   **Mes Dossiers** : `GET /mine?email={email}` (Nécessite Header `X-Tenant-Id`)

---

## 3. API Administration (Secrétariat & Admissions)
Base URL : `/enrollment/api/v1/admin/applications`

### 3.1 Consultation & Recherche
*   **Liste tous** : `GET /`
*   **Recherche** : `GET /search?q={query}` (Nom, Prénom, Réf)
*   **Détail/Récépissé** : `GET /{id}/receipt`

### 3.2 Saisie Directe (Guichet)
*   **URL** : `POST /direct`
*   **Payload (`FastEntryRequest`)** : Fusion de `CreateApplicationRequest` + `CandidateInfo`. Crée un dossier directement en statut `SUBMITTED`.

### 3.3 Traitement Opérationnel
*   **Évaluation** : `PATCH /{id}/assessment`
    ```json
    {
      "grades": { "Maths": 15.5, "Français": 14.0 },
      "comments": "Texte libre",
      "decision": "ADMITTED | REFUSED | WAITLISTED",
      "recommendedLevelId": "uuid"
    }
    ```
*   **Réception Physique** : `PATCH /{id}/documents/{docCode}/receive`
*   **Vérification Admin** : `PATCH /{id}/verify` (Passe à `VERIFIED`)
*   **Annulation Admin** : `POST /{id}/cancel`

---

## 4. API Direction (Validation Stratégique)
Base URL : `/enrollment/api/v1/admin/direction/applications`

| Méthode | Endpoint | Description |
| :--- | :--- | :--- |
| `PATCH` | `/{id}/validate` | Validation finale (Admission confirmée). |
| `PATCH` | `/{id}/reject` | Refus définitif (Body: `String` raison). |
| `PATCH` | `/{id}/waitlist` | Mise en liste d'attente. |
| `POST` | `/bulk-validate` | Validation par lot (Body: `List<UUID>`). |

---

## 5. Modèles de Données (TypeScript / DTOs)

### 5.1 ApplicationResponse (Vue Parent)
```typescript
export interface ApplicationResponse {
  id: string;
  reference: string;
  accessCode?: string; // Uniquement à la création
  type: 'NEW' | 'RE_ENROLLMENT';
  status: ApplicationStatus;
  candidate: CandidateInfo;
  documents: RequiredDocument[];
  trackerMessage: string;
  createdAt: string;
  updatedAt: string;
}
```

### 5.2 AdminApplicationResponse (Vue Complète)
```typescript
export interface AdminApplicationResponse extends ApplicationResponse {
  channel: 'DIGITAL' | 'DIRECT';
  primaryGuardian: GuardianInfo;
  wish: SchoolingWish;
  assessment?: Assessment;
  subscriptions: ServiceSubscription[];
  customFields: Record<string, any>;
}
```

### 5.3 Types de Base
```typescript
export type ApplicationStatus = 
  | 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'TESTING' 
  | 'WAITLIST' | 'VALIDATED' | 'REJECTED' | 'CANCELLED';

export interface GuardianInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  relation: 'FATHER' | 'MOTHER' | 'GUARDIAN';
  address?: string;
  profession?: string;
}

export interface CandidateInfo {
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: string;
  birthPlace: string;
  nationality: string;
}

export interface RequiredDocument {
  code: string;
  name: string;
  mandatory: boolean;
  status: 'MISSING' | 'PHYSICAL_RECEIVED' | 'UPLOADED';
  fileUrl?: string;
}
```

---

## 6. Gestion des Erreurs
Le service retourne des objets `ErrorResponse` (4xx, 5xx) :
```json
{
  "message": "Message d'erreur explicite",
  "status": 400,
  "timestamp": "2026-03-25T10:00:00Z",
  "path": "/api/v1/..."
}
```

---
*Documentation Technique - Version 1.1 (Mars 2026)*
