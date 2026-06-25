# Guide de Gestion des Utilisateurs (Comptes d'Accès)

Ce document détaille le fonctionnement de la gestion des comptes utilisateurs dans Feewi. 
**Note importante :** Il y a une distinction stricte entre le **Staff** (Identité physique/RH) et l'**Utilisateur** (Compte d'accès/Auth).

## 1. Philosophie de Gestion
1.  **Staff d'abord** : On crée d'abord une fiche Staff (Nom, Prénom, Matricule).
2.  **Compte optionnel** : Un membre du Staff n'a pas forcément de compte utilisateur (ex: personnel de service).
3.  **Liaison unique** : Un compte utilisateur (`User`) est lié à une seule fiche `Staff` via `staffId`.

## 2. Cycle de Vie d'un Compte

### A. Création d'un compte
L'administrateur crée un compte pour un membre du personnel existant.
- **Endpoint** : `POST /api/v1/users`
- **Champs clés** : `email`, `password`, `staffId`, `roles` (liste de noms de rôles).
- **Comportement** : Le compte est créé avec le flag `forceChangePassword: true`.

### B. Premier Login
Lors de la première connexion, le frontend doit vérifier le champ `forceChangePassword` dans la réponse de `/api/v1/users/me`.
- Si `true`, rediriger l'utilisateur vers un formulaire "Définir votre mot de passe".

### C. Activation/Désactivation
Un administrateur peut suspendre l'accès sans supprimer les données.
- **Endpoint** : `PATCH /api/v1/users/{id}/active`
- **Body** : `{ "active": false }`
- **Sécurité** : Un admin ne peut pas désactiver son propre compte.

## 3. Flux des Mots de Passe

### A. Mot de passe oublié (Flux OTP Externe)
1. **Demande** : `POST /api/v1/auth/forgot-password` (Body: `{"email": "..."}`)
   - Envoie un code à 6 chiffres par email.
2. **Réinitialisation** : `POST /api/v1/auth/reset-password`
   - Body: `{"email": "...", "code": "123456", "newPassword": "..."}`

### B. Changement de mot de passe (Utilisateur Connecté)
Lorsqu'un utilisateur est connecté (ex: depuis son profil), il peut changer son mot de passe en fournissant l'ancien.
- **Endpoint** : `POST /api/v1/auth/change-password`
- **Body** : `{"oldPassword": "...", "newPassword": "..."}`
- **Comportement** : Le flag `forceChangePassword` passe à `false` si l'opération réussit.

## 4. Référence API pour le Frontend

### Liste des Utilisateurs (Tableau d'administration)
`GET /api/v1/users?page=0&size=10&search=nom&type=ADMIN`
- **Paramètres** : 
  - `search` : Recherche par nom, prénom ou email.
  - `type` : Filtrer par type (TEACHER, ADMIN, etc.).

### Profil de l'utilisateur connecté
`GET /api/v1/users/me`
- Retourne les infos, rôles et surtout les **permissions** à stocker dans le store (Vuex/Pinia/Redux) pour gérer l'affichage conditionnel des menus.

### Détails complets d'un utilisateur
`GET /api/v1/users/{id}/profile`
- Retourne les statistiques de connexion (date du dernier login, nombre de connexions, etc.).

## 5. Gestion des Rôles (RBAC)

Lors de l'édition d'un utilisateur, le frontend doit charger la liste des rôles disponibles pour l'établissement.
- **Endpoint** : `GET /api/v1/roles`
- **Propriétés à surveiller** :
  - `isSystemRole` : Si `true`, le rôle ne peut pas être modifié ou supprimé (ex: ROLE_ADMIN).
  - `permissions` : Liste des codes de permissions associés au rôle.

## 6. Codes d'erreurs communs
- `403 Forbidden` (Accès refusé) : L'utilisateur n'a pas la permission (ex: `identity:user:write`).
- `403 Forbidden` (Auto-modification) : Tentative de modifier ses propres rôles.
- `400 Bad Request` : Email déjà utilisé ou Staff non trouvé.
- `400 Bad Request` (Changement de mot de passe) : Ancien mot de passe incorrect.
