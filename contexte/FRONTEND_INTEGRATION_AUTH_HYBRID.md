# Guide d'Intégration : Authentification Hybride (Frontend)

Ce document est destiné à l'équipe Frontend pour expliquer les changements récents dans la gestion de l'authentification et des permissions.

## 1. Résumé du Changement
Nous sommes passés d'un modèle "Tout dans le JWT" à un modèle **Hybride**.
- **Avant** : Le JWT contenait l'identité, les rôles ET toutes les permissions.
- **Maintenant** : Le JWT est **allégé**. Il contient l'identité et les rôles. Les **permissions** sont récupérées via une API dédiée et injectées dynamiquement par la Gateway pour le Backend.

## 2. Nouveau Flux de Connexion (Côté Frontend)

### Étape 1 : Login Classique
`POST /api/v1/auth/login` -> Récupération du JWT.

### Étape 2 : Chargement du Profil (Nouveau)
Dès que vous avez le token, vous **devez** appeler l'endpoint suivant pour obtenir la liste des permissions nécessaires à l'affichage de l'UI :
`GET /api/v1/users/me`

### Étape 3 : Stockage Global
Stockez la réponse du `/me` dans votre Store (Pinia, Vuex, Redux). C'est ce tableau `permissions` qui doit piloter vos `v-if`, `*ngIf` ou Guards.

## 3. Comparaison du JWT (Payload)

| Champ | Ancien JWT | Nouveau JWT (Hybride) |
| :--- | :--- | :--- |
| `sub` (Email) | ✅ Présent | ✅ Présent |
| `tenant_id` | ✅ Présent | ✅ Présent |
| `roles` | ✅ Présent | ✅ Présent |
| `permissions` | ⚠️ Présent (Volumineux) | ❌ **ABSENT** |

## 4. Pourquoi ce changement ?
1. **Performance** : Les tokens devenaient trop gros, provoquant des erreurs "431 Request Header Fields Too Large".
2. **Réactivité** : Si un admin change un droit, un simple rafraîchissement de la page (`F5`) met à jour l'UI car l'appel au `/me` récupère les données fraîches depuis le cache Redis du Backend.
3. **Sécurité** : Moins de données sensibles circulent dans le token stocké dans le navigateur.

## 5. Exemple d'Intégration (Typescript)

```typescript
// Structure de la réponse /me
interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[]; // <--- Utilisez ceci pour l'UI
}

// Dans votre service d'authentification
async login(credentials: LoginReq) {
  const token = await this.http.post('/auth/login', credentials);
  localStorage.setItem('token', token);
  
  // CHARGEMENT IMMEDIAT DU PROFIL
  const profile = await this.http.get<UserProfile>('/users/me');
  this.userStore.setUser(profile);
}

// Dans vos templates
// <button *ngIf="hasPermission('academic:structure:write')">Ajouter une classe</button>
```

## 6. Questions Fréquentes (Troubleshooting)

**Q : Pourquoi j'ai une 403 sur un microservice alors que je suis Admin ?**
R : Vérifiez que vous passez bien le token Bearer. Le Backend (Gateway) s'occupe tout seul d'aller chercher les permissions et de les transmettre aux microservices. Si vous avez une 403, c'est probablement que l'utilisateur n'a réellement pas la permission en base de données.

**Q : Est-ce que je dois appeler `/me` à chaque clic ?**
R : Non. Appelez-le une fois au démarrage de l'application ou après le login, et gardez le résultat en mémoire (Store).

**Q : Comment voir les changements de permissions sans se déconnecter ?**
R : Un simple rafraîchissement du navigateur suffit pour ré-exécuter l'appel au `/me`.
