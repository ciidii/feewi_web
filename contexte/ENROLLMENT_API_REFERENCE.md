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
Base URL : `/enrollment/api/v1/public`

### 2.1 Résumé du portail (Landing Page)
Point d'entrée unique pour l'accueil du portail. Il fusionne les données d'Admission et les dates du calendrier Académique.

*   **URL** : `GET /config/summary`
*   **Header Requis** : `X-Tenant-Id: <ID_ECOLE>`
*   **Description** : Permet au frontend de décider s'il affiche le bouton "S'inscrire" et quel message de bienvenue montrer.
*   **Réponse (`PublicPortalSummary`)** :
    | Champ | Type | Description |
    | :--- | :--- | :--- |
    | `tenantId` | `string` | Identifiant de l'établissement. |
    | `portalActive` | `boolean` | État de l'interrupteur manuel (Master Switch). |
    | `academicYearLabel` | `string` | Libellé de l'année (ex: "2026-2027"). |
    | `registrationStartDate` | `date` | Date d'ouverture officielle. |
    | `registrationEndDate` | `date` | Date de clôture officielle. |
    | `withinDates` | `boolean` | **Vrai** si la date du jour est entre début et fin. |
    | `welcomeMessage` | `string` | Texte rédigé par l'école pour l'accueil. |
    | `legalText` | `string` | Règlement intérieur / CGU. |
    | `enabledServices` | `string[]` | Liste des services (TRANSPORT, CANTEEN). |

### 2.2 Récupérer la configuration effective (Formulaire dynamique)
Calcul de la règle finale à appliquer selon le niveau choisi.

*   **URL** : `GET /config/{levelId}`
*   **Description** : Le backend applique l'algorithme suivant : `Config Finale = Config par Défaut + Surcharge du Niveau`.
*   **Réponse (`EffectiveConfigResponse`)** :
    | Bloc | Contenu |
    | :--- | :--- |
    | `documentChecklist` | Liste des pièces (écrasée si le niveau a sa propre liste). |
    | `coreFieldOverrides` | Fusion des champs masqués/renommés (Le niveau est prioritaire). |
    | `formSchema` | Champs JSONB libres (Cercle 3). |
    | `assessmentConfig` | Type de test (EXAM/DOSSIER) et matières à évaluer. |
    | `instructions` | Dictionnaire d'aide contextuelle par étape. |

### 2.3 Création d'un dossier (Initialisation)
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

### 2.5 Champs Personnalisés (Formulaire spécifique à l'école)
*   **URL** : `PATCH /{id}/custom-fields`
*   **Description** : Permet de répondre aux questions spécifiques définies par l'établissement.
*   **Payload** : Objet JSON clé/valeur libre.
    ```json
    {
      "is_allergic": true,
      "allergy_details": "Arachides",
      "previous_school_city": "Thiès"
    }
    ```

### 2.6 Gestion des Services (Cantine, Transport)
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
    *   **Contrôle Temps-Réel** : Le service interroge le *Academic Structure Service* pour vérifier que la fenêtre d'inscription est bien ouverte pour l'année scolaire concernée.
    *   **Contrôle de Capacité** : Vérification des quotas disponibles (si configuré).
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
*   **Détail complet** : `GET /{id}/details`

### 3.2 Saisie Directe (Guichet)
*   **URL** : `POST /direct`
*   **Payload (`FastEntryRequest`)** : Fusion de `CreateApplicationRequest` + `CandidateInfo`. 
*   **Action** : Crée un dossier directement en statut `SUBMITTED`. Le système génère automatiquement la référence et le code d'accès.

### 3.3 Traitement Opérationnel (Workflow Hybride)
Une fois le dossier au statut `VERIFIED` (conformité OK), l'administration décide du parcours du candidat :

#### 📦 Gestion des Documents (Numérisation différée)
Pour les dossiers physiques, le secrétaire marque la réception papier :
*   **Endpoint** : `PATCH /{id}/documents/{docCode}/receive`
*   **Effet** : Le document passe en statut `PHYSICAL_RECEIVED`.
*   **Contrainte** : Le statut `PHYSICAL_RECEIVED` permet de passer en `VERIFIED` mais **bloque** la validation finale (`VALIDATED`).

#### 🔒 Verrou Numérique
Avant la validation Direction, tout document marqué `mandatory: true` dans la configuration doit impérativement être en statut `UPLOADED`.
*   **Action** : Le secrétaire doit utiliser `POST /{id}/documents/{docCode}` pour uploader le scan et lever le verrou.

#### CAS A : Admission sur titre (Directe)
*   **Action** : Passer directement à la validation.
*   **Endpoint** : `PATCH /api/v1/admin/direction/applications/{id}/validate`

#### CAS B : Examen de niveau requis
*   **Action** : Le dossier passe au statut `TESTING`.
*   **Saisie des notes** : `PATCH /api/v1/admin/applications/{id}/assessment`
*   **Payload** : 
    ```json
    {
      "grades": { "Français": 12.0, "Mathématiques": 14.5 },
      "comments": "Bon niveau global",
      "decision": "ADMITTED",
      "recommendedLevelId": "uuid"
    }
    ```

---

## 4. Politique d'Évaluation (Configuration)
L'école définit les épreuves possibles par niveau dans `levelOverrides`.

### 4.1 Structure de l'objet AssessmentConfig
```json
{
  "assessmentType": "EXAM | DOSSIER | INTERVIEW",
  "subjects": ["Français", "Mathématiques", "Anglais"],
  "minPassingGrade": 10.0
}
```
*Le frontend doit utiliser cette liste de `subjects` pour générer dynamiquement le formulaire de saisie des notes.*

---

## 5. API Direction (Validation Stratégique)
Base URL : `/enrollment/api/v1/admin/direction/applications`

| Méthode | Endpoint | Description |
| :--- | :--- | :--- |
| `PATCH` | `/{id}/validate` | Validation finale (Admission confirmée). |
| `PATCH` | `/{id}/reject` | Refus définitif (Body: `String` raison). |
| `PATCH` | `/{id}/waitlist` | Mise en liste d'attente. |
| `POST` | `/bulk-validate` | Validation par lot (Body: `List<UUID>`). |

---

## 5. Configuration de l'Admission (`/api/v1/admin/config`)
Ces points d'accès permettent à l'école de personnaliser son portail public.

### 5.1 Récupérer la configuration actuelle
*   **URL** : `GET /`
*   **Description** : Retourne la checklist des documents, le schéma des champs personnalisés et les services activés.
*   **Réponse (`EnrollmentConfig`)** :
    ```json
    {
      "tenantId": "ecole-test",
      "documentChecklist": [
        { "code": "EXT", "name": "Extrait de Naissance", "mandatory": true },
        { "code": "BUL", "name": "Bulletins de notes", "mandatory": true }
      ],
      "formSchema": {
        "customFields": [
          { "name": "allergies", "label": "Allergies connues", "type": "text" }
        ]
      },
      "enabledServices": ["CANTEEN", "TRANSPORT"]
    }
    ```

### 5.2 Mettre à jour la configuration globale
*   **URL** : `PUT /`
*   **Description** : Écrase l'intégralité de la configuration.
*   **Payload** : Objet `EnrollmentConfig` complet.

### 5.3 Gérer l'état du portail (Master Switch)
*   **URL** : `PATCH /portal-status?active={true|false}`
*   **Description** : Fermeture ou ouverture instantanée du portail public.

### 5.4 Personnaliser un niveau spécifique
*   **URL** : `PATCH /level-overrides/{levelId}`
*   **Description** : Définit des règles propres à un niveau (ex: documents différents pour la Terminale).
*   **Payload (`LevelOverride`)** :
    ```json
    {
      "documentChecklist": [
        { "code": "BUL", "name": "Relevé de notes 1ère", "mandatory": true }
      ],
      "coreFieldOverrides": {
        "previousSchool": { "mandatory": true, "label": "Lycée d'origine" }
      },
      "formSchema": { "specialty": "S1 | S2" }
    }
    ```

---

## 6. Modèles de Données (TypeScript / DTOs)

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
