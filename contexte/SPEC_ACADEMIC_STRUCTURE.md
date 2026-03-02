# Spécifications Fonctionnelles : Academic Structure Service (Référentiel Structure)

## 1. Introduction
Le service **Academic Structure** est le garant de l'organisation temporelle et structurelle d'un établissement scolaire au sein de la plateforme Feewi. Il agit comme un référentiel (Master Data) pour tout ce qui concerne le cadre d'enseignement.

## 2. État des Lieux (Analyse Technique Initiale)
- **Framework :** Spring Boot 3.x (Java 17+).
- **Persistance :** PostgreSQL avec isolation par `tenant_id`.
- **Migration :** Flyway.
- **Communication :** Destiné à consommer des événements via RabbitMQ (ex: `ADMISSION_VALIDATED`).

---

## 3. Analyse Fonctionnelle Détaillée

### 3.1 Gestion de la Multi-tenancy
Chaque donnée doit être isolée par un `tenant_id`.
- **Règle de sécurité :** Aucun accès aux données ne doit être possible sans un `tenant_id` valide extrait du token JWT.
- **Consistance :** Toutes les tables possèdent une colonne `tenant_id`.

### 3.2 Gestion de la Temporalité (Années et Périodes)
L'année scolaire est le pivot central. Elle définit non seulement le calendrier administratif mais aussi les fenêtres opérationnelles pour les inscriptions et les évaluations.

#### 3.2.1 Jalons de l'Année Scolaire :
- **Calendrier Administratif** : Dates de début et fin de l'exercice (ex: 01/09 au 31/08).
- **Fenêtre d'Inscription** : Période durant laquelle le portail parent est ouvert pour les nouvelles admissions.
- **Calendrier Pédagogique** : Dates réelles de début et de fin des cours.

#### 3.2.2 Découpage en Périodes (Trimestres / Semestres) :
Chaque année est divisée en périodes académiques qui pilotent les évaluations :
- **Dates de cours** : Début et fin de la période d'enseignement.
- **Fenêtre d'Examen** : Dates prévues pour les compositions ou examens de fin de période.
- **Date Limite de Saisie (Grading Deadline)** : Date après laquelle les professeurs ne peuvent plus modifier les notes dans le système.

#### 3.2.3 Congés et Fêtes :
Gestion des interruptions (vacances, jours fériés) pour le calcul des taux de présence et la planification.

#### 3.2.4 Cycle de vie de l'Année Scolaire :
1.  **`PLANNING` (Préparation) :** Configuration initiale, pré-inscriptions ouvertes.
2.  **`ACTIVE` (Opérationnelle) :** Année de référence par défaut. **Une seule par établissement.**
3.  **`CLOSING` (Clôture) :** Transition, saisie des décisions académiques finalisées.
4.  **`ARCHIVED` (Historique) :** Lecture seule, conservation des données historiques.

### 3.3 Structure Académique (Niveaux, Cycles et Filières)
Le système supporte une structure multi-niveaux adaptée aux différents types d'établissements.

#### 3.3.1 Hiérarchie Pédagogique
1.  **Niveaux** : L'échelon de base de progression (ex: "CP", "3ème"). Chaque niveau possède un `rank` pour automatiser la promotion.
2.  **Filières (Séries/Tracks)** : Utilisées principalement au Lycée (ex: Terminale S, Terminale L).
3.  **Classes (Instances Annuelles)** : Unité opérationnelle rattachée à un niveau pour une année spécifique (ex: "CM2-B 2024-2025").

---

## 4. Modèle de Données (Proposition Technique)

### 4.1 Référentiels (Configuration Statique)
- **`educational_levels`** : `id`, `tenant_id`, `name`, `cycle_type`, `rank`.
- **`filieres`** : `id`, `tenant_id`, `name`, `code`.

### 4.2 Structure Temporelle et Opérationnelle
- **`academic_years`** :
    - `id` (UUID), `tenant_id` (String).
    - `label` (String), `status` (ENUM), `system_type` (ENUM).
    - `admin_start_date`, `admin_end_date`.
    - `registration_start_date`, `registration_end_date`.
    - `lessons_start_date`, `lessons_end_date`.
- **`academic_periods`** :
    - `id`, `tenant_id`, `academic_year_id` (FK).
    - `label`, `start_date`, `end_date`.
    - `exam_start_date`, `exam_end_date`.
    - `grading_deadline`.
- **`academic_holidays`** :
    - `id`, `tenant_id`, `academic_year_id` (FK).
    - `label`, `start_date`, `end_date`, `is_school_closed`.

### 4.3 Structure Physique des Classes
- **`classes`** :
    - `id`, `tenant_id`, `academic_year_id` (FK), `level_id` (FK), `filiere_id` (FK).
    - `name`, `capacity`.
- **`class_staff`** : Lien entre les enseignants (Identity) et les classes.

---

## 5. Cas aux Limites et Exceptions (Edge Cases)
... (Reste identique à la spécification originale)

## 6. Contraintes de Cohérence Temporelle (Règles Métier)
Pour garantir l'intégrité des données, le système applique les règles de validation suivantes :

### 6.1 Année Administrative
- **Chronologie** : `admin_start_date` < `admin_end_date`.
- **Non-chevauchement** : Deux années d'un même établissement ne peuvent pas se chevaucher.
- **Durée** : Une année doit durer entre 6 et 12 mois.

### 6.2 Calendrier Pédagogique
- **Inclusion** : La période des cours `[lessons_start_date, lessons_end_date]` doit être incluse dans la période administrative.
- **Cohérence** : Les cours ne peuvent pas se terminer avant d'avoir commencé.

### 6.3 Fenêtre d'Inscription
- **Logique** : `registration_start_date` < `registration_end_date`.
- **Anticipation** : Les inscriptions peuvent débuter avant l'année administrative.

### 6.4 Périodes et Examens
- **Séquençage** : Les périodes (Trimestres/Semestres) doivent être chronologiques.
- **Emboîtement** : Toutes les périodes doivent être incluses dans la fenêtre des cours.
- **Examens** : Les dates de composition doivent être situées à l'intérieur de leur période.
- **Notes** : La date limite de saisie (`grading_deadline`) doit être postérieure à la fin des examens.

### 6.5 Workflow de Clôture et Cycle de Vie
Pour sécuriser la fin d'année, les règles de transition suivantes sont appliquées :
- **Clôture (`ACTIVE` -> `CLOSING`)** : Possible uniquement si l'année est active. Une alerte est générée si la date de fin des cours n'est pas encore atteinte.
- **Réouverture (`CLOSING` -> `ACTIVE`)** : Possible uniquement si aucune autre année n'a été activée entre-temps.
- **Archivage (`CLOSING` -> `ARCHIVED`)** : Action définitive. L'année passe en lecture seule.

---

## 7. Points d'accès API (Cycle de Vie)

| Méthode | Path | État |
| :--- | :--- | :--- |
| `PATCH` | `/api/v1/academic/years/{id}/close` | Implémenté |
| `PATCH` | `/api/v1/academic/years/{id}/reopen` | Implémenté |
| `PATCH` | `/api/v1/academic/years/{id}/archive` | Implémenté |
| `GET` | `/api/v1/academic/years/{id}/closing-checklist` | **NON IMPLÉMENTÉ** |

*Note sur la Checklist : Cet endpoint est prévu pour valider la complétude des données (notes, promotions) avant l'archivage définitif.*

---

## 8. Traçabilité et Audit
Le service doit maintenir un historique (Audit Log) pour les actions sensibles.
- **Actions tracées** : Changement de statut d'année, création de classes, modification de dates clés.
