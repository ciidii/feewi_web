# Guide des Permissions Sémantiques : Module Enrollment

Ce document détaille les nouvelles permissions sémantiques pour le module d'inscription, remplaçant les anciens termes génériques (read/write).

## 1. Philosophie de Nommage
Nous utilisons désormais des **verbes d'action métier** au lieu de termes CRUD. Cela permet une intégration UI plus intuitive et une sécurité plus fine.

## 2. Matrice des Permissions (Sémantique)

| Code Permission | Action UI Recommandée | Description Métier |
| :--- | :--- | :--- |
| `enrollment:config:manage` | Accès aux réglages portail | Ouvrir/Fermer le portail, modifier le formulaire, gérer les dates. |
| `enrollment:admission:view` | Liste & Détails | Droit de consulter les dossiers et l'historique des candidats. |
| `enrollment:admission:submit`| Bouton "Saisie Directe" | Saisir un dossier pour un parent au guichet (Voie Directe). |
| `enrollment:admission:verify`| Bouton "Vérifier" | Pointer la réception des documents physiques et valider la conformité. |
| `enrollment:admission:assess`| Formulaire de notes | Saisir les résultats du test d'entrée ou de l'entretien. |
| `enrollment:admission:decide`| Boutons "Valider"/"Rejeter"| Prendre la décision finale de transformer un candidat en élève. |
| `enrollment:admission:cancel`| Icône Corbeille / Annuler | Interrompre définitivement un processus d'inscription. |

## 3. Exemple d'Intégration Frontend (Angular)

```typescript
// Exemple de gestion d'affichage des boutons dans le dashboard des admissions
export class AdmissionDetailComponent {
  
  // Ces permissions viennent du store (résultat de /api/v1/users/me)
  canAssess = this.authStore.hasPermission('enrollment:admission:assess');
  canDecide = this.authStore.hasPermission('enrollment:admission:decide');
  canVerify = this.authStore.hasPermission('enrollment:admission:verify');

  // L'UI affiche les actions selon les droits réels
}
```

## 4. Rôles par défaut mis à jour

Les rôles "Presets" ont été automatiquement migrés :
- **Secrétariat** : Possède `view`, `submit`, `verify`, `cancel`. (Gestionnaire de dossiers)
- **Directeur des Études** : Possède `view`, `assess`, `decide`, `cancel` + `config:manage`. (Pilote stratégique)
- **ROLE_ADMIN** : Possède `config:manage` + tous les droits de gestion IAM.

## 5. Notes pour les Développeurs
- **JWT** : Ne cherchez plus ces codes dans le token JWT, ils sont désormais fournis par l'API `/me`.
- **Anciennes permissions** : Les permissions `enrollment:admission:read/write/validate` sont devenues obsolètes et ne doivent plus être utilisées.
