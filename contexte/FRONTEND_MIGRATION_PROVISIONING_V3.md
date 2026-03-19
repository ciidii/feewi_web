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

## 3. Gestion des Cycles, Niveaux et Filières (Cadre Structurel)

### 3.1 Architecture "Provisioned-Only"
Désormais, les écoles ne peuvent plus **créer** de cycles, niveaux ou filières (`POST` interdit). Tout le squelette de l'école est généré automatiquement lors de l'inscription. L'utilisateur (Admin École) a uniquement un droit de **Lecture** et de **Personnalisation** (Renommage/Activation).

### 3.2 Endpoints de Gestion

| Entité | Méthode | Path | Action |
| :--- | :--- | :--- | :--- |
| **Cycles** | `GET` | `/api/v1/academic/cycles` | Liste tous les cycles activés de l'école. |
| | `PATCH` | `/api/v1/academic/cycles/{id}` | Modifier le `customName` ou le statut `active`. |
| **Niveaux** | `GET` | `/api/v1/academic/levels` | Liste tous les niveaux (Option: `?cycleId=uuid`). |
| | `PATCH` | `/api/v1/academic/levels/{id}` | Renommer un niveau (ex: "6ème" -> "Sixième A"). |
| **Filières** | `GET` | `/api/v1/academic/filieres` | Liste toutes les séries provisionnées. |
| | `PATCH` | `/api/v1/academic/filieres/{id}/status` | Activer/Désactiver une série (`?active=true/false`). |

#### Exemples de réponses (JSON)

**Cycle :**
```json
{
  "id": "uuid-activation",
  "cycleCode": "MIDDLE_SCHOOL",
  "systemName": "Moyen (Collège)",
  "customName": "Cycle CEM",
  "active": true,
  "rank": 3
}
```

**Niveau :**
```json
{
  "id": "uuid-niveau",
  "name": "6ème",
  "rank": 1,
  "cycle": {
    "id": "uuid-cycle-parent",
    "name": "Cycle CEM",
    "code": "MIDDLE_SCHOOL"
  }
}
```

**Filière :**
```json
{
  "id": "uuid-filiere",
  "name": "Scientifique (S1)",
  "code": "S1",
  "active": true
}
```

### 3.3 Dynamisme par Pays
Les noms des cycles et des niveaux ne sont plus fixes. 
*   Pour `educationTemplate: "SN_FR"` : Vous verrez "Moyen", "6ème".
*   Pour `educationTemplate: "GMB_EN"` : Vous verrez "Upper Basic", "Grade 7".
*   **Règle Angular** : Toujours utiliser les labels renvoyés par l'API sans faire de "hard-coding" sur les noms de classe.

---

## 4. Gestion des Matières (`/api/v1/academic/subjects`)
L'école peut gérer son propre catalogue de matières.

| Méthode | Path | Action |
| :--- | :--- | :--- |
| `GET` | `/` | Liste toutes les matières de l'école (Provisionnées + Créées). |
| `POST` | `/` | Créer une nouvelle matière spécifique à l'établissement. |
| `PUT` | `/{id}` | Modifier le nom ou le code d'une matière. |
| `DELETE` | `/{id}` | Supprimer une matière. |

---

## 5. Le Programme (Curriculum) : Contrat & Volume Horaire
### 5.1 Configuration (`/api/v1/academic/curriculum`)
L'écran de configuration du programme permet désormais de gérer le "Contrat" entre l'école et l'élève.

| Méthode | Path | Action |
| :--- | :--- | :--- |
| `GET` | `/by-level/{id}` | Liste le programme d'un niveau (avec `filiereId` optionnel). |
| `POST` | `/` | **Ajouter** une matière au programme d'un niveau. |
| `PUT` | `/{id}` | **Modifier** les paramètres (Coeff, Heures). |
| `DELETE` | `/{id}` | **Retirer** une matière du programme d'un niveau. |

### 5.2 Champs Clés
*   **`defaultCoefficient`** : Poids de la matière (Decimal).
*   **`weeklyHours` (Nouveau)** : Volume horaire hebdomadaire (Decimal). Crucial pour l'emploi du temps.
*   **`filiereId`** : Permet de définir un programme spécifique (ex: Maths en Seconde S1). Si `null`, c'est du Tronc Commun.

---

## 6. Le Syllabus : Progression Pédagogique
C'est la hiérarchie de contenu provisionnée depuis le modèle national.

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

## 7. Le Cadre Temporel (Années & Périodes)
Contrairement aux cadres structurel et pédagogique, le temps **n'est pas provisionné**.

### 7.1 Le Principe : Liberté Locale
Chaque école possède son propre calendrier. Feewi laisse donc le directeur créer ses années et ses périodes de A à Z. Cela permet :
*   De choisir ses propres dates de rentrée et de fin.
*   De définir son système de découpage (Semestres vs Trimestres).
*   D'ajuster les périodes d'examens en fonction de son rythme.

### 7.2 Endpoints de Gestion du Temps

| Entité | Méthode | Path | Action |
| :--- | :--- | :--- | :--- |
| **Années** | `POST` | `/api/v1/academic/years` | Créer une nouvelle année scolaire. |
| | `PUT` | `/api/v1/academic/years/{id}` | Modifier les dates ou le libellé. |
| | `PATCH` | `/api/v1/academic/years/{id}/activate` | Activer l'année (Une seule active à la fois). |
| **Périodes** | `POST` | `/api/v1/academic/years/{id}/periods` | Créer un Semestre/Trimestre. |
| | `GET` | `/api/v1/academic/years/{id}/periods` | Lister les périodes d'une année. |

---

## 8. Tableau des Champs Techniques (Résumé)

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
