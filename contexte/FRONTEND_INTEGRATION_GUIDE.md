# Guide d'Intégration Frontend : Identity & Auth

Ce document détaille les informations nécessaires pour connecter le Frontend (Angular/React) à l'écosystème Feewi.

## 1. Points d'Entrée (Base URL)
Toutes les requêtes doivent passer par l'**API Gateway** :
*   **URL :** `http://localhost:8080`
*   **Préfixe :** `/api/v1`

## 2. Flux d'Authentification

### A. Connexion
*   **Endpoint :** `POST /auth/login`
*   **Request :** `{ "email": "...", "password": "..." }`
*   **Response :** 
    ```json
    {
      "access_token": "eyJhbGci...",
      "token_type": "Bearer"
    }
    ```
*   **Action :** Stocker le token dans le `localStorage` ou dans un store sécurisé.

### B. Gestion du Token (Intercepteur)
Chaque requête suivante (sauf login) doit inclure le header :
`Authorization: Bearer <votre_token>`

## 3. Informations Utilisateur & Multi-tenancy

Dès que l'utilisateur est connecté, appelez : `GET /users/me`

### Format de la réponse :
```json
{
  "id": "uuid",
  "email": "user@email.com",
  "firstName": "Alioune",
  "lastName": "Diop",
  "tenantId": "gspm",
  "active": true,
  "roles": ["ROLE_ADMIN"],
  "permissions": ["student:read", "school:manage"]
}
```

### Concepts clés pour le Frontend :
1.  **`tenantId`** : Indispensable. Vous n'avez pas besoin de l'envoyer dans les headers (la Gateway le fait pour vous), mais il est utile pour le branding (logo, nom de l'école).
2.  **`permissions`** : Utilisez cette liste pour afficher/cacher les boutons ou menus (ex: si `admission:validate` n'est pas là, le bouton "Valider" doit être désactivé).

## 4. Matrice des Rôles Standard

| Rôle | Description | Usage typique |
| :--- | :--- | :--- |
| `ROLE_SUPER_ADMIN` | Personnel Feewi | Dashboard global, gestion des écoles. |
| `ROLE_ADMIN` | Directeur d'école | Gestion du personnel, config école. |
| `ROLE_SECRETARY` | Secrétariat | Admissions, inscriptions, documents. |

## 5. Gestion des Erreurs API

Le Backend renvoie des erreurs structurées :
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "L'adresse email est déjà utilisée.",
  "timestamp": "2026-02-26T..."
}
```
*   **401** : Token expiré ou manquant -> Rediriger vers `/login`.
*   **403** : Droits insuffisants -> Afficher une page "Accès Interdit".
*   **429** : Trop de requêtes (Rate Limit) -> Afficher un message de patience.

## 6. Environnements Bruno
L'équipe Frontend peut utiliser la collection Bruno située dans le dossier `/bruno` pour tester les réponses manuellement avant de coder.
