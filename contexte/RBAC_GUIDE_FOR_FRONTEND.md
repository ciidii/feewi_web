# Guide du Système de Permissions (RBAC/PBAC) - Feewi

Ce document détaille le fonctionnement de la sécurité, des rôles et des permissions pour l'intégration avec le Frontend Angular.

## 1. Architecture à 3 Niveaux

Le système Feewi utilise une hiérarchie de rôles pour équilibrer sécurité plateforme et flexibilité établissement :

| Niveau | Type | Propriétaire | Modifiable ? | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Niveau 1** | **Système** | Feewi (Platform) | Non | Rôles de gestion globale (`ROLE_SUPER_ADMIN`). Invisibles pour les écoles. |
| **Niveau 2** | **Socle (Core)** | Feewi (Shared) | Non | Le rôle `ROLE_ADMIN` de l'école. Verrouillé pour garantir l'accès. |
| **Niveau 3** | **Local / Presets** | Établissement | **OUI** | Rôles métiers (`Secrétariat`, `Comptable`). Entièrement personnalisables par l'école. |

---

## 2. Nomenclature des Permissions (PBAC)

Nous sommes passés d'un modèle basé sur les rôles à un modèle basé sur les **Permissions (Autorités)**. 
**Format :** `domaine:ressource:action`

### Pourquoi ?
Cela permet au Frontend de masquer/afficher des boutons précisément. 
*Exemple :* Un utilisateur a `identity:user:read` mais pas `identity:user:write` -> On affiche la liste des utilisateurs mais on cache le bouton "Ajouter".

### Actions Standards :
*   `:read` : Consulter les données (GET).
*   `:write` : Créer ou modifier (POST, PUT, PATCH).
*   `:delete` : Supprimer (DELETE).
*   `:lifecycle` : Opérations spéciales d'état (ex: clôturer une année).

---

## 3. Consommation dans le Frontend (Approche Hybride)

Suite à l'allègement du token pour la performance, la source de vérité est divisée :

1.  **Le JWT (Statique)** : Contient uniquement l'identité et les **Rôles** (ex: `["ROLE_ADMIN", "Comptable"]`).
2.  **L'API `/me` (Dynamique)** : Contient la liste exhaustive et temps réel des **Permissions**.

### Flux de Chargement Recommandé :
1.  **Login** -> Récupération du JWT.
2.  **Initialisation de l'App** -> Appel à `GET /api/v1/users/me`.
3.  **Store (Pinia/Redux)** -> Stocker l'objet complet incluant le tableau `permissions`.

### Pourquoi ce changement ?
- **Performance** : Évite d'avoir un token JWT trop volumineux (bugs de headers HTTP).
- **Réactivité** : Permet de mettre à jour les droits d'un utilisateur (via F5) sans forcer une reconnexion.

### Exemple d'usage dans Angular :
```typescript
// Guard ou Directive
const canWrite = store.user.permissions.includes('academic:structure:write');
```

---

## 4. Catalogue des Permissions Initiales (PBAC)

### Identity Service (IAM)
*   `identity:user:read` / `identity:user:write` / `identity:user:delete`
*   `identity:role:read` / `identity:role:write` / `identity:role:delete`
*   `identity:audit:read`
*   `identity:school:read` / `identity:school:write` (Paramètres établissement)

### Academic Service
*   `academic:structure:read` / `academic:structure:write` (Classes, Matières)
*   `academic:year:read` / `academic:year:write` / `academic:year:lifecycle`
*   `academic:teaching:read` / `academic:teaching:write`
*   `academic:assignment:read` / `academic:assignment:write`
*   `academic:attendance:read` / `academic:attendance:write`
*   `academic:discipline:read` / `academic:discipline:write`
*   `academic:exam:read` / `academic:exam:write`

---

## 5. Mécanisme d'Auto-Déclaration
Le système est **dynamique**. Si un nouveau microservice est ajouté, il enregistre ses propres permissions. 
Pour l'écran de **Gestion des Rôles**, récupérez toujours la liste fraîche des permissions disponibles :
**Endpoint :** `GET /api/v1/permissions`

---

## 6. Bonnes Pratiques Frontend
1.  **Testez toujours la Permission**, jamais le nom d'un rôle personnalisé (Niveau 3).
2.  **Verrouillage UI** : Si un rôle a `isSystemRole: true`, désactivez les boutons "Éditer" et "Supprimer" dans votre tableau des rôles.
3.  **Auto-Modification** : Un Administrateur peut modifier ses propres rôles, mais le système l'empêchera de se désactiver ou de se retirer son propre accès `ROLE_ADMIN` s'il est le seul.
