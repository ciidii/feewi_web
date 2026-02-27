# Référence API : Identity Service (v1)

Ce document détaille l'ensemble des points d'accès du service d'identité, les structures de données attendues et les contraintes de sécurité.

## 1. Informations Générales
*   **Base URL (via Gateway) :** `http://localhost:8080/api/v1`
*   **Format d'échange :** JSON (`application/json`)
*   **Authentification :** JWT Bearer Token dans le header `Authorization`.
*   **Isolation SaaS :** Header `X-Tenant-ID` requis pour toutes les opérations liées à une école.

---

## 2. Authentification & Sécurité (`/auth`)

### 2.1 Connexion (Login)
*   **URL :** `POST /auth/login`
*   **Accès :** Public
*   **Requête :**
    ```json
    {
      "email": "admin@feewi.com",
      "password": "password123"
    }
    ```
*   **Réponse (200 OK) :**
    ```json
    {
      "access_token": "eyJhbGci...",
      "token_type": "Bearer"
    }
    ```

### 2.2 Mot de passe oublié (Demande OTP)
*   **URL :** `POST /auth/forgot-password`
*   **Accès :** Public
*   **Requête :** `{ "email": "user@email.com" }`
*   **Effet :** Envoie un code à 6 chiffres par email.

### 2.3 Réinitialisation du mot de passe (Vérification OTP)
*   **URL :** `POST /auth/reset-password`
*   **Accès :** Public
*   **Requête :**
    ```json
    {
      "email": "user@email.com",
      "code": "123456",
      "newPassword": "newPassword123"
    }
    ```

---

## 3. Gestion des Écoles (`/schools`)

### 3.1 Enregistrer une école (SaaS Provisioning)
*   **URL :** `POST /schools`
*   **Accès :** `ROLE_SUPER_ADMIN`
*   **Requête :**
    ```json
    {
      "tenantId": "gspm",
      "name": "Groupe Scolaire Petit Monde",
      "slogan": "Excellence",
      "phone": "+221...",
      "email": "contact@gspm.sn",
      "streetAddress": "...",
      "city": "Dakar",
      "adminEmail": "admin@gspm.sn",
      "adminFirstName": "Alioune",
      "adminLastName": "Diop",
      "adminPassword": "..."
    }
    ```

### 3.2 Lister les écoles (Paginé)
*   **URL :** `GET /schools?search=...&page=0&size=10`
*   **Accès :** `ROLE_SUPER_ADMIN`
*   **Réponse :** Objet `Page<School>` de Spring Data.

### 3.3 Modifier une école
*   **URL :** `PUT /schools/{id}`
*   **Accès :** `ROLE_SUPER_ADMIN` ou `OWNER`
*   **Requête :** (Mêmes champs que POST, hors admin et tenantId)

---

## 4. Gestion des Utilisateurs (`/users`)

### 4.1 Profil de l'utilisateur connecté
*   **URL :** `GET /users/me`
*   **Accès :** Authentifié
*   **Réponse :**
    ```json
    {
      "id": "uuid",
      "email": "...",
      "firstName": "...",
      "lastName": "...",
      "tenantId": "...",
      "active": true,
      "roles": ["ROLE_ADMIN"],
      "permissions": ["student:read", "..."]
    }
    ```

### 4.2 Créer un employé (Staff)
*   **URL :** `POST /users`
*   **Accès :** `ROLE_ADMIN`
*   **Headers requis :** `X-Tenant-ID`
*   **Requête :**
    ```json
    {
      "email": "secretaire@...",
      "password": "...",
      "firstName": "...",
      "lastName": "...",
      "phone": "...",
      "roles": ["ROLE_SECRETARY"]
    }
    ```

---

## 5. Moteur RBAC (`/roles`, `/permissions`)

### 5.1 Lister les rôles (Hybride)
*   **URL :** `GET /roles`
*   **Headers requis :** `X-Tenant-ID`
*   **Description :** Renvoie les rôles de l'école + les rôles `SYSTEM`.

### 5.2 Créer un rôle personnalisé
*   **URL :** `POST /roles`
*   **Requête :**
    ```json
    {
      "name": "ROLE_SURVEILLANT",
      "description": "...",
      "permissions": ["student:read", "student:write"]
    }
    ```

---

## 6. Gestion des Erreurs Standard
Toutes les erreurs suivent ce format :
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Description de l'erreur",
  "timestamp": "2026-02-26T...",
  "path": "/api/v1/..."
}
```
| Code | Signification |
| :--- | :--- |
| `401` | Non authentifié (JWT invalide ou manquant) |
| `403` | Accès refusé (Droits insuffisants ou CSRF) |
| `404` | Ressource non trouvée |
| `429` | Trop de requêtes (Rate Limiting) |
| `500` | Erreur interne du serveur |
