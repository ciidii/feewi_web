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

## 3. Consommation dans le Frontend (JWT)

Lors du login, le JWT reçu contient deux claims importants :

1.  `roles` : Liste des codes de rôles (ex: `["ROLE_ADMIN", "Secrétariat"]`).
2.  `permissions` : Liste plate de toutes les autorités (ex: `["identity:user:read", "academic:structure:write", ...]`).

### Stratégie d'affichage (UI)
Il est fortement recommandé de baser la logique d'affichage sur le claim `permissions` :
```typescript
// Exemple de Guard ou Directive
if (user.hasPermission('academic:exam:write')) {
  showAddNoteButton = true;
}
```

---

## 4. Catalogue des Permissions Initiales

### Identity Service (IAM)
*   `identity:user:read` / `identity:user:write` / `identity:user:delete`
*   `identity:role:read` / `identity:role:write` / `identity:role:delete`
*   `identity:audit:read`
*   `identity:school:create` / `identity:school:read` / `identity:school:write` (SaaS Admin)

### Academic Service
*   `academic:structure:read` / `academic:structure:write` (Classes, Matières)
*   `academic:year:read` / `academic:year:write` / `academic:year:lifecycle`
*   `academic:teaching:read` / `academic:teaching:write` (Affectation Profs)
*   `academic:assignment:read` / `academic:assignment:write` (Affectation Élèves)
*   `academic:attendance:read` / `academic:attendance:write` (Appel)
*   `academic:discipline:read` / `academic:discipline:write`
*   `academic:exam:read` / `academic:exam:write`

---

## 5. Mécanisme d'Auto-Déclaration
Le système est **dynamique**. Si un nouveau microservice est ajouté (ex: `canteen-service`), il enregistrera ses propres permissions. 
Le Frontend doit donc être capable de récupérer dynamiquement la liste des permissions disponibles via l'Identity Service pour l'écran de gestion des rôles :
**Endpoint :** `GET /api/v1/permissions`

---

## 6. Bonnes Pratiques Frontend
1.  **Ne jamais coder en dur un accès sur un nom de rôle custom** (Niveau 3), car l'école peut le renommer. Toujours tester la **Permission**.
2.  **Badge "Système"** : Pour les rôles du Niveau 2 (`ROLE_ADMIN`), le champ `isSystemRole: true` est renvoyé par l'API. Le Frontend doit désactiver les boutons "Éditer" et "Supprimer" pour ces rôles.
