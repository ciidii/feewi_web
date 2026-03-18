# Guide Technique : Provisioning Automatisé & Architecture Multi-Pays

Ce document est destiné à l'équipe Frontend Angular. Il détaille le fonctionnement de l'automatisation de la structure scolaire (Multi-Pays) et les impacts sur l'interface utilisateur.

---

## 1. La Vision "Quick Start" Pédagogique
Feewi ne livre plus une "coquille vide". Dès qu'une école est inscrite, le système génère automatiquement toute sa structure pédagogique basée sur le **modèle national** choisi :
1.  **Ses Abonnements** (Cycles activés : ex: Lower Basic, High School).
2.  **Sa Structure** (Niveaux pré-remplis : ex: Grade 7, 2nde S).
3.  **Son Catalogue de Matières** (Clonage des matières nationales).
4.  **Son Programme (Curriculum)** : Matières liées aux niveaux avec **Coefficients** et **Volumes Horaires** officiels.
5.  **Son Syllabus (Nouveauté)** : Domaines, Chapitres et Objectifs d'apprentissage pré-chargés.

---

## 2. Authentification et Droits (JWT)
Le jeton JWT reste la source de vérité.
*   **Claim `allowed_cycles`** : Codes des cycles souscrits (ex: `["PRIMARY", "MIDDLE_SCHOOL"]`).
*   **Claim `tenant_id`** : Identifiant de l'école.
*   **Action Angular** : Masquer les menus correspondant aux cycles non souscrits.

---

## 3. Gestion des Cycles et Niveaux
### 3.1 Dynamisme par Pays
Les noms des cycles et des niveaux ne sont plus fixes. 
*   Pour `educationTemplate: "SN_FR"` : Vous verrez "Moyen", "6ème".
*   Pour `educationTemplate: "GMB_EN"` : Vous verrez "Upper Basic", "Grade 7".
*   **Règle Angular** : Toujours utiliser les labels renvoyés par l'API sans faire de "hard-coding" sur les noms de classe.

---

## 4. Le Programme (Curriculum) : Contrat & Volume Horaire
### 4.1 Configuration (`/api/v1/academic/curriculum`)
L'écran de configuration du programme permet désormais de gérer :
*   **`defaultCoefficient`** : Poids de la matière.
*   **`weeklyHours` (Nouveau)** : Nombre d'heures de cours par semaine. Indispensable pour l'affichage des emplois du temps.
*   **`maxScore`** : Note maximale (ex: 20 au Sénégal, 100 en Gambie).

---

## 5. Le Syllabus : Progression Pédagogique (Nouveauté)
C'est la grande nouveauté architecturale. Chaque matière d'un niveau possède une hiérarchie de contenu.

### 5.1 Structure de données
L'API renvoie désormais une structure en cascade :
1.  **SyllabusDomain** : ex: "Activités Numériques".
2.  **SyllabusChapter** : ex: "Nombres décimaux", Durée : 3 semaines.
3.  **LearningObjective** : ex: "Savoir multiplier deux décimaux".

### 5.2 Usage Frontend
*   **Cahier de texte** : Permettre au professeur de cocher les chapitres terminés ou les objectifs validés.
*   **Progression** : Afficher une barre de progression basée sur la durée estimée des chapitres par rapport aux semaines écoulées.

---

## 6. Workflow de Création d'École (Super Admin)
Le formulaire de création doit envoyer le code du système national souhaité :
*   `educationTemplate` : 
    *   `"SN_FR"` : Sénégal (Francophone)
    *   `"GMB_EN"` : Gambie (Anglophone)
    *   `"GUI_FR"` : Guinée (Francophone)
*   `allowedCycles` : Liste des codes de cycles à activer.

---

## 7. Tableau des Champs Techniques (Résumé)

| Champ API | Type | Description |
| :--- | :--- | :--- |
| `weeklyHours` | BigDecimal | Volume horaire par semaine (ex: 5.5) |
| `templateCode` | String | Identifiant du pays (ex: SN_FR) |
| `estimatedDuration`| Integer | Durée d'un chapitre en semaines |
| `rank` | Integer | Ordre d'affichage (Cycles, Niveaux, Chapitres) |

---

## 8. Recommandations UX
*   **Localisation** : Adaptez les formats de nombres et de dates selon le pays de l'école (déduit du template).
*   **ReadOnly** : Les éléments issus du template national sont suggérés par défaut. L'utilisateur ne doit créer des surcharges (Overrides) que si son établissement dévie du programme officiel.

*Rédigé par l'Équipe Architecture - Mars 2026*
