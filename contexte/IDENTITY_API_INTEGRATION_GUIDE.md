# Guide d'Intégration API - Identity Service (SaaS & IAM)

Ce document détaille les points d'entrée (endpoints) du service d'identité pour l'intégration du portail Super Admin (SaaS) et des portails d'établissement.

**Base URL :** `/api/v1`
**Format :** JSON (UTF-8)
**Authentification :** Bearer Token (JWT) dans le header `Authorization`.

---

## 1. Authentification & Sécurité (`/auth`)

### Connexion (Login)
*   **Endpoint :** `POST /auth/login`
*   **Rôle :** Public
*   **Entrée :**
    ```json
    {
      "email": "admin@feewi.com",
      "password": "password123"
    }
    ```
*   **Sortie (200 OK) :**
    ```json
    {
      "access_token": "eyJhbG...",
      "token_type": "Bearer"
    }
    ```

### Mot de passe oublié (OTP)
*   **Endpoint :** `POST /auth/forgot-password`
*   **Entrée :** `{"email": "user@email.com"}`
*   **Description :** Envoie un code à 6 chiffres par email.

### Réinitialisation du mot de passe
*   **Endpoint :** `POST /auth/reset-password`
*   **Entrée :**
    ```json
    {
      "email": "user@email.com",
      "code": "123456",
      "newPassword": "NewSecurePassword123!"
    }
    ```

---

## 2. Gestion des Établissements (SaaS - Super Admin)

### Créer une nouvelle école (Provisioning)
*   **Endpoint :** `POST /schools`
*   **Rôle :** `ROLE_SUPER_ADMIN`
*   **Entrée :**
    ```json
    {
      "tenantId": "gspm",
      "name": "Groupe Scolaire Privé Moderne",
      "email": "contact@gspm.sn",
      "phone": "+221338000000",
      "educationTemplate": "SN_FR",
      "allowedCycles": ["PRIMARY", "MIDDLE"],
      "adminEmail": "directeur@gspm.sn",
      "adminFirstName": "Jean",
      "adminLastName": "Dupont",
      "adminPassword": "TemporaryPassword123"
    }
    ```

### Lister les écoles
*   **Endpoint :** `GET /schools?search=gspm&page=0&size=10`
*   **Rôle :** `ROLE_SUPER_ADMIN`
*   **Sortie :** Page d'objets `SchoolResponse`.

### Modifier une école
*   **Endpoint :** `PUT /schools/{id}`
*   **Entrée :** (Mêmes champs que POST, hors `tenantId` et `admin*`)

### Changer le statut (Suspendre/Activer)
*   **Endpoint :** `PATCH /schools/{id}/status`
*   **Entrée :** `{"status": "SUSPENDED" | "ACTIVE" | "TRIAL"}`

---

## 3. Gestion des Utilisateurs (`/users`)

### Profil de l'utilisateur connecté
*   **Endpoint :** `GET /users/me`
*   **Rôle :** Authentifié
*   **Sortie :** `UserResponse` (Email, Nom, Prénom, Tenant, Rôles, Permissions).

### Lister les utilisateurs (du Tenant)
*   **Endpoint :** `GET /users?type=TEACHER&search=jean`
*   **Rôle :** `ROLE_ADMIN` (Locale) ou `ROLE_SUPER_ADMIN` (Global).
*   **Note :** Filtre automatiquement par `tenantId` basé sur le token.

### Créer un utilisateur (Staff/Admin)
*   **Endpoint :** `POST /users`
*   **Entrée :**
    ```json
    {
      "email": "staff@ecole.sn",
      "password": "...",
      "firstName": "Awa",
      "lastName": "Diop",
      "userTypeCode": "STAFF",
      "roles": ["ROLE_SECRETARY"]
    }
    ```

---

## 4. Rôles et Permissions (RBAC)

### Lister les rôles disponibles
*   **Endpoint :** `GET /roles`
*   **Sortie :** Liste incluant les rôles système (ex: `ROLE_ADMIN`) et les rôles personnalisés créés par l'école.

### Créer/Modifier un rôle personnalisé
*   **Endpoint :** `POST /roles` | `PUT /roles/{id}`
*   **Entrée :**
    ```json
    {
      "name": "COMPTABLE",
      "description": "Accès aux finances",
      "permissions": ["student:read", "billing:manage"]
    }
    ```

---

## 5. Audit & Surveillance

### Journal d'audit global
*   **Endpoint :** `GET /audit`
*   **Rôle :** `ROLE_SUPER_ADMIN`
*   **Description :** Historique de toutes les actions sensibles sur la plateforme.

### Journal d'audit d'établissement
*   **Endpoint :** `GET /audit/tenant`
*   **Rôle :** `ROLE_ADMIN`
*   **Description :** Actions limitées à l'école de l'utilisateur.

---

## Objets de Réponse Communs

### UserResponse
```json
{
  "id": "uuid",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "tenantId": "string",
  "userType": "ADMIN|TEACHER|STUDENT|...",
  "active": true,
  "roles": ["string"],
  "permissions": ["string"]
}
```

### SchoolResponse
```json
{
  "id": "uuid",
  "tenantId": "string",
  "name": "string",
  "status": "TRIAL|ACTIVE|SUSPENDED",
  "createdAt": "ISO-8601-DateTime"
}
```
