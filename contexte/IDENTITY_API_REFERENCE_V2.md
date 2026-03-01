# Référence API : Identity Service (v1) - Spécifications Administratives

Ce document détaille l'ensemble des points d'accès du service d'identité mis à jour pour le backoffice et la gestion du personnel.

## 1. Informations Générales
*   **Base URL (via Gateway) :** `http://localhost:8080/api/v1`
*   **Format d'échange :** JSON (`application/json`)
*   **Authentification :** JWT Bearer Token requis.
*   **Isolation SaaS :** 
    *   Le `tenantId` est désormais extrait **prioritairement du JWT** pour les opérations de ressources (Sécurité IDOR).
    *   Le header `X-Tenant-ID` peut être conservé pour le routage Gateway mais n'est plus la source de vérité pour le filtrage de données.

---

## 2. Authentification & Sécurité (`/auth`)

### 2.1 Connexion (Login)
*   **URL :** `POST /auth/login`
*   **Effet de bord :** Met à jour `lastLoginAt`, `connectionCount` et génère un log d'audit `LOGIN_SUCCESS`.
*   **Réponse (200 OK) :**
    ```json
    {
      "access_token": "eyJhbGci...",
      "token_type": "Bearer"
    }
    ```

### 2.2 Impersonnalisation (Support)
*   **URL :** `POST /auth/impersonate/{userId}`
*   **Accès :** `ROLE_SUPER_ADMIN` uniquement.
*   **Description :** Permet d'obtenir un token au nom d'un administrateur d'école pour le support.

---

## 3. Gestion des Écoles (`/schools`)

### 3.1 Lister les écoles (Backoffice Feewi)
*   **URL :** `GET /schools?search=...&page=0&size=10`
*   **Accès :** `ROLE_SUPER_ADMIN`
*   **Réponse (Page de SchoolResponse) :**
    ```json
    {
      "content": [{
        "id": "uuid",
        "tenantId": "gspm",
        "name": "Groupe Scolaire Petit Monde",
        "status": "ACTIVE",
        "logoUrl": "...",
        "createdAt": "2023-10-27T..."
      }]
    }
    ```

---

## 4. Gestion des Utilisateurs & Personnel (`/users`)

### 4.1 Liste du personnel (Scoped par École)
*   **URL :** `GET /users?search=...`
*   **Accès :** `ROLE_ADMIN`
*   **Sécurité :** Ne renvoie que les membres du même établissement que l'admin (via JWT).
*   **Réponse :** `Page<UserResponse>`

### 4.2 Profil Complet (Vue Administrative)
*   **URL :** `GET /users/{id}/profile`
*   **Accès :** `ROLE_ADMIN`
*   **Nouveaux Champs (Angular) :**
    ```json
    {
      "id": "uuid",
      "email": "fatou@gspm.sn",
      "phone": "+221...",
      "active": true,
      "lastLoginAt": "2026-03-01T14:30:00Z",
      "connectionCount": 15,
      "lastDeviceType": "Desktop",
      "roles": ["ROLE_SECRETARY"],
      "createdAt": "..."
    }
    ```

### 4.3 Restrictions de mise à jour
*   **Auto-Modification Interdite** : Un utilisateur recevra une erreur `403 Forbidden` s'il tente de modifier ses propres rôles ou de désactiver son propre compte via `PUT /users/{id}` ou `PATCH /users/{id}/active`.

---

## 5. Moteur RBAC & Statistiques (`/roles`)

### 5.1 Lister les rôles avec effectifs
*   **URL :** `GET /roles`
*   **Description :** Très utile pour le dashboard Angular (ex: "Vous avez 20 enseignants").
*   **Réponse :**
    ```json
    [
      {
        "name": "ROLE_TEACHER",
        "description": "Enseignants",
        "memberCount": 20,
        "isSystemRole": true,
        "permissions": ["student:read", "grade:write"]
      }
    ]
    ```

### 5.2 Lister les permissions disponibles
*   **URL :** `GET /permissions`
*   **Accès :** Authentifié
*   **Description :** Permet à l'Admin d'école de voir toutes les actions qu'il peut inclure dans un rôle personnalisé.
*   **Réponse (Liste de PermissionResponse) :**
    ```json
    [
      {
        "id": "uuid",
        "name": "student:read",
        "description": "Droit de consulter la liste des élèves"
      }
    ]
    ```

### 5.3 Créer une permission (SaaS)
*   **URL :** `POST /permissions`
*   **Accès :** `ROLE_SUPER_ADMIN` uniquement.
*   **Requête :** `{ "name": "finance:write", "description": "..." }`

---

## 6. Audit & Traçabilité (`/audit`)

### 6.1 Consulter les logs (Vue École)
*   **URL :** `GET /audit/tenant`
*   **Accès :** `ROLE_ADMIN`
*   **Usage :** Permet de voir qui a fait quoi dans l'établissement (ex: "Admin X a désactivé le compte de Y").
*   **Réponse :**
    ```json
    {
      "content": [{
        "timestamp": "2026-03-01T12:00:00Z",
        "actorEmail": "admin@feewi.com",
        "action": "USER_ACCOUNT_DISABLED",
        "targetId": "uuid-du-membre",
        "description": "Le compte utilisateur a été désactivé"
      }]
    }
    ```

---

## 7. Guide d'Intégration Frontend (Angular)

### Intercepteur de Sécurité
*   Il n'est plus nécessaire d'ajouter manuellement `X-Tenant-ID` pour les requêtes vers `/users/**` ou `/roles/**` si le jeton est présent.
*   **Gestion des Erreurs 403** : Prévoir un message spécifique pour les violations de règles métier (ex: "Vous ne pouvez pas modifier vos propres droits").

### Composants Tableaux
*   Utiliser `UserResponse` pour les listes légères.
*   Utiliser `UserFullProfileResponse` uniquement pour la modale de détails d'un membre.
*   Afficher `memberCount` dans le sélecteur de rôles pour donner de la visibilité sur la structure de l'école.
