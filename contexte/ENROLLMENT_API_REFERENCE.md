# Référence API : Enrollment Service (Admissions)

Ce document est le contrat d'interface entre le Backend et le Frontend (Angular/Mobile).

---

## 1. Principes d'Authentification

| Espace | Authentification | Header |
| :--- | :--- | :--- |
| **Portail Parent** | Anonyme | `X-Tenant-Id: <ID_ECOLE>` |
| **Portail Admin** | Bearer Token (JWT) | `Authorization: Bearer <TOKEN>` |

---

## 2. Cycle de Vie et Endpoints (Step-by-Step)

### ÉTAPE 1 : Initialisation (Lead Capture)
**Le parent crée son dossier en fournissant ses propres coordonnées.**

*   **URL** : `POST /enrollment/api/v1/public/applications`
*   **Payload** :
    ```json
    {
      "tenantId": "ecole-excellence",
      "type": "NEW",
      "academicYearId": "uuid",
      "primaryGuardian": {
        "firstName": "Ibrahima",
        "lastName": "Diallo",
        "email": "ibra.diallo@test.com",
        "phone": "+221771234567",
        "relation": "FATHER"
      }
    }
    ```

### ÉTAPE 2 : Informations du Candidat & Niveau
**Le parent ajoute les informations de l'enfant et choisit le niveau scolaire.**

*   **URL** : `PATCH /enrollment/api/v1/public/applications/{id}/candidate`
*   **Payload** :
    ```json
    {
      "info": {
        "firstName": "Samba",
        "lastName": "Diop",
        "gender": "MALE",
        "birthDate": "2016-08-20",
        "birthPlace": "Saint-Louis",
        "nationality": "Sénégalaise"
      },
      "levelId": "uuid",
      "filiereId": "uuid (optionnel)"
    }
    ```

### ÉTAPE 3 : Pièces Jointes (Upload)
**Le parent ou le secrétaire uploade les scans des documents requis.**

*   **URL** : `POST /enrollment/api/v1/public/applications/{id}/documents/{docCode}`
*   **Path Variable `{docCode}`** : `EXT` (Extrait), `BUL` (Bulletin), `PHOTO` (Photo).
*   **Body** : `String` (URL brute du fichier après upload sur le Document Engine).
*   **Exemple** : `"https://storage.feewi.com/docs/extrait_samba.pdf"`

### ÉTAPE 4 : Suivi (Tracking)
**Le parent revient sur son dossier plus tard via son code secret.**

*   **URL** : `GET /enrollment/api/v1/public/applications/{reference}/track?accessCode={code}`
*   **Response Body (TS)** : `ApplicationResponse`

### ÉTAPE 5 : Soumission Finale
**Le parent valide l'envoi définitif du dossier.**

*   **URL** : `POST /enrollment/api/v1/public/applications/{id}/submit`
*   **Action** : Le dossier passe de `DRAFT` à `SUBMITTED`.

---

## 3. Endpoints Administration (Secrétariat & Direction)

### Liste des dossiers à traiter
*   **URL** : `GET /enrollment/api/v1/admin/applications`
*   **Response Body** : `List<AdminApplicationResponse>`

### Réception physique (Guichet)
*   **URL** : `PATCH /enrollment/api/v1/admin/applications/{id}/documents/{docCode}/receive`
*   **Action** : Marque le document comme `PHYSICAL_RECEIVED`.

### Évaluation Pédagogique
*   **URL** : `PATCH /enrollment/api/v1/admin/applications/{id}/assessment`
*   **Request Body (TS)** : `Assessment`
*   **Exemple JSON** :
    ```json
    {
      "grades": { "Français": 14, "Maths": 16 },
      "comments": "Excellent profil",
      "decision": "ADMITTED",
      "recommendedLevelId": "uuid"
    }
    ```

### Validation Finale (Direction)
*   **URL** : `PATCH /enrollment/api/v1/admin/direction/applications/{id}/validate`
*   **Vérification** : Échoue si des documents obligatoires ne sont pas `UPLOADED`.

---

## 4. Interfaces TypeScript (Modèles Angular)

```typescript
export interface ApplicationResponse {
  id: string;
  reference: string;
  accessCode?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'TESTING' | 'VALIDATED' | 'REJECTED';
  candidate: CandidateInfo;
  primaryGuardian: GuardianInfo;
  documents: RequiredDocument[];
  trackerMessage: string;
}

export interface GuardianInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  relation: 'FATHER' | 'MOTHER' | 'GUARDIAN';
  address?: string;
}

export interface CandidateInfo {
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: string; // YYYY-MM-DD
  birthPlace?: string;
}

export interface RequiredDocument {
  code: string;
  name: string;
  mandatory: boolean;
  status: 'MISSING' | 'PHYSICAL_RECEIVED' | 'UPLOADED';
  fileUrl?: string;
}
```
