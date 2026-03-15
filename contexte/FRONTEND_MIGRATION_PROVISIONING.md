# Guide Technique : Provisioning Automatisé & Système de "Quick Start"

Ce document est destiné à l'équipe Frontend Angular. Il détaille le fonctionnement de l'automatisation de la structure scolaire et les impacts sur l'interface utilisateur.

---

## 1. La Vision "Quick Start"
Feewi ne livre plus une "coquille vide". Dès qu'une école est inscrite, le système génère automatiquement :
1.  **Ses Abonnements** (Cycles activés en base).
2.  **Sa Structure** (Niveaux pré-remplis : CI, CP, 6ème...).
3.  **Son Catalogue de Matières** (Clonage des matières nationales).
4.  **Son Programme (Curriculum)** (Matières liées aux niveaux avec coefficients par défaut).

---

## 2. Authentification et Droits (JWT)
Le jeton JWT est la source de vérité pour l'affichage des menus.
*   **Claim `allowed_cycles`** : Contient les codes des cycles payés (ex: `["PRIMARY", "MIDDLE_SCHOOL"]`).
*   **Action Angular** : Masquer les onglets ou menus correspondant aux cycles non présents dans cette liste.

---

## 3. Gestion des Cycles (`/api/v1/academic/cycles`)
### 3.1 Affichage
L'API `GET /cycles` ne renvoie désormais que les cycles **activés** pour l'école.
*   Le champ `name` peut être personnalisé par l'école.
*   Le champ `code` (ex: `PRIMARY`) est stable et doit être utilisé pour vos conditions logiques (if/switch).

### 3.2 Personnalisation (Nouveauté)
L'école ne peut plus créer de cycles (`POST` désactivé pour les tenants). Elle peut uniquement **renommer** ses cycles via un futur endpoint `PATCH` (en cours de planification).

---

## 4. Gestion des Niveaux (`/api/v1/academic/levels`)
*   **Provisioning** : Les niveaux sont déjà là. L'admin n'a plus besoin de passer par l'écran "Création de niveaux" au premier démarrage.
*   **Relation** : Chaque niveau est lié à un `activatedCycle` (l'abonnement de l'école).

---

## 5. Le Programme (Curriculum) : Le Cœur du Métier
### 5.1 Les Matières (`/api/v1/academic/subjects`)
*   **Le Concept de Clonage** : Les matières affichées pour une école sont des **copies privées** des matières nationales.
*   **Édition** : L'école peut modifier le nom ou le code de ses matières sans affecter le système global.

### 5.2 Configuration du Programme (`/api/v1/academic/curriculum`)
C'est ici que l'admin ajuste son école après le provisioning.
*   **Endpoints** : `GET /by-level/{levelId}`
*   **Usage** : Permettre à l'admin de modifier les coefficients par défaut générés par le robot.
*   **Règle** : Si une école veut ajouter une matière propre à elle (ex: "Escrime"), elle doit d'abord créer la matière dans "Matières", puis l'ajouter au niveau via cet écran.

---

## 6. Workflow de Création d'École (Super Admin)
Endpoint : `POST /api/v1/identity/schools`
Le formulaire de création doit obligatoirement envoyer :
*   `educationTemplate` : `"SN_FR"` (Sénégal) ou `"STANDARD"`.
*   `allowedCycles` : Tableau de chaînes (ex: `["MATERNAL", "PRIMARY"]`).

---

## 7. Tableau de Correspondance des Codes (Standard)

| Cycle Code | Niveaux Typiques (Sénégal) | Matières de base |
| :--- | :--- | :--- |
| `MATERNAL` | Petite, Moyenne, Grande Section | Langage, Motricité, Art... |
| `PRIMARY` | CI, CP, CE1, CE2, CM1, CM2 | Mathématiques, Français, EVP... |
| `MIDDLE_SCHOOL` | 6ème, 5ème, 4ème, 3ème | Maths, Français, PC, SVT... |
| `HIGH_SCHOOL` | Seconde, Première, Terminale | Maths, PC, Philo, Français... |

---

## 8. Codes d'Erreurs Spécifiques
*   **403 Forbidden** : L'école tente de manipuler un cycle ou une matière système sans autorisation.
*   **Message d'erreur recommandé** : "Cette fonctionnalité nécessite une souscription au cycle [Nom du Cycle]".

*Rédigé par l'Équipe Architecture - Mars 2026*
