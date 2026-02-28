# Stratégie de Versioning et Workflow Git : Feewi

Pour garantir une collaboration fluide et une qualité de code constante, le projet Feewi adopte le **GitHub Flow** associé au standard **Conventional Commits**.

## 1. Modèle de Branchage (GitHub Flow)

- **`main`** : La branche principale. Elle doit TOUJOURS être stable et prête pour la production.
- **Branches de travail (`feature/`, `fix/`, `chore/`)** :
    - On ne travaille JAMAIS directement sur `main`.
    - Pour chaque tâche, on crée une branche courte (ex: `feature/identity-rbac-engine` ou `fix/login-error-handling`).
    - Une fois la tâche terminée, on crée une **Pull Request (PR)** vers `main`.

## 2. Standard de Commit (Conventional Commits)

Chaque message de commit doit suivre le format : `<type>(<scope>): <description>`

### Types autorisés :
- **feat** : Nouvelle fonctionnalité (ex: `feat(identity): add school logo field`).
- **fix** : Correction de bug.
- **chore** : Maintenance ou mise à jour de config (ex: `chore(deps): update spring boot`).
- **docs** : Documentation uniquement.
- **refactor** : Modification du code qui ne change pas le comportement (amélioration structurelle).
- **test** : Ajout ou modification de tests.

### Règle d'or :
- Un commit = Une seule responsabilité.
- Utilisez l'impératif présent dans la description (ex: "add" au lieu de "added").

## 3. Workflow de Validation

1. **Développement** : Créer une branche -> Coder -> Commiter (standardisé).
2. **Qualité Locale** : Lancer `./mvnw spotless:apply` pour formater le code avant de pousser.
3. **Pull Request** :
    - Titre clair et description des changements.
    - Passage des tests automatisés (CI).
    - Revue de code par un pair.
4. **Merge** : Utiliser le **Squash and Merge** pour garder un historique `main` propre et linéaire.

## 4. Versioning (SemVer)

Le projet utilise le **Semantic Versioning 2.0.0** : `MAJOR.MINOR.PATCH`
- **MAJOR** : Changements incompatibles (rupture de contrat API).
- **MINOR** : Ajout de fonctionnalités (compatibilité ascendante).
- **PATCH** : Corrections de bugs (compatibilité ascendante).
