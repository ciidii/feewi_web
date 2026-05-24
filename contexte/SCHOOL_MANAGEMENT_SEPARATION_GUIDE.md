# Guide de Gestion des Établissements : SaaS vs Local

Ce document détaille la séparation radicale entre la gestion de la plateforme (Super Admin) et la gestion locale d'un établissement (Admin École).

## 1. Philosophie de Sécurité
Pour garantir l'isolation Multi-Tenant, les permissions sont désormais divisées en deux domaines distincts :
- **SaaS (Platform)** : Actions transverses sur tous les établissements (réservé au Super Admin Feewi).
- **Local (Tenant)** : Actions limitées aux paramètres de son propre établissement (réservé à l'Admin de l'école).

---

## 2. Gestion de la Plateforme (Super Admin)

Ces endpoints sont utilisés par le **Portail d'Administration Feewi**.

### Permissions Requises
- `identity:saas:school:list` : Voir la liste de toutes les écoles.
- `identity:saas:school:create` : Enregistrer un nouvel établissement.
- `identity:saas:school:manage` : Suspendre ou Activer une école (gestion abonnement).
- `identity:saas:school:delete` : Suppression définitive.

### API Principale
- `GET /api/v1/schools` : Liste paginée de toutes les écoles.
- `POST /api/v1/schools` : Création initiale (Provisioning).
- `PATCH /api/v1/schools/{id}/status` : Changement de statut (TRIAL, ACTIVE, SUSPENDED).

---

## 3. Gestion Locale (Admin École)

Ces endpoints sont utilisés par le **Dashboard de l'Établissement** (Paramètres de l'école).

### Permissions Requises
- `identity:school:read` : Lire les informations de sa propre école.
- `identity:school:update` : Modifier le logo, le slogan ou les coordonnées.

### API Dédiée (Nouveau)
L'administrateur local n'a pas besoin de connaître son UUID, le système utilise le `tenantId` extrait du JWT.

- **Récupérer mes infos** : `GET /api/v1/schools/my-school`
- **Mettre à jour mon établissement** : `PATCH /api/v1/schools/my-school`
  - **Corps de la requête (JSON)** :
    ```json
    {
      "name": "Nouveau Nom",
      "slogan": "Nouvelle devise",
      "phone": "+221...",
      "email": "contact@ecole.sn",
      "logoUrl": "https://..."
    }
    ```

---

## 4. Recommandations pour l'Intégration Frontend

### Pour le Super Admin
- Utiliser les routes `/api/v1/schools` classiques.
- L'UI doit permettre de gérer le cycle de vie commercial (statut, cycles autorisés).

### Pour l'Administrateur École
- **NE PAS UTILISER** les routes avec un ID (`/api/v1/schools/{id}`).
- Utiliser exclusivement les routes `/my-school`.
- Masquer les champs "Système" (tenantId, statut, éducationTemplate) car ils ne sont pas modifiables localement.

### Vérification des Permissions
```typescript
// Exemple pour afficher le bouton de modification du logo
const canUpdateBranding = user.permissions.includes('identity:school:update');
```
