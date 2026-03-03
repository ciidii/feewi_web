# Spécifications Fonctionnelles : Academic Structure Service (Référentiel Structure)

## 1. Introduction
Le service **Academic Structure** est le garant de l'organisation temporelle et structurelle d'un établissement scolaire au sein de la plateforme Feewi. Il agit comme un référentiel (Master Data) pour tout ce qui concerne le cadre d'enseignement.

---

## 2. Architecture Technique & Sécurité
- **Multi-tenancy** : Isolation stricte par `tenant_id` extrait du JWT. Aucun accès inter-établissement possible.
- **Zéro Fuite** : Utilisation systématique de DTOs de réponse. Les entités internes ne sont jamais exposées.
- **Validation** : Toutes les entrées sont validées par des contraintes métier avant persistance.

---

## 3. Modèle de Données (Catalogue des Entités)

### 3.1 Structure Temporelle
- **`AcademicYear`** : Définit le calendrier global (Admin, Inscriptions, Cours).
- **`AcademicPeriod`** : Découpage pédagogique (Trimestres/Semestres) rattaché à une année.
- **`AcademicHoliday`** : Jours fériés et vacances scolaires.

### 3.2 Structure Pédagogique
- **`EducationalCycle`** : Grands blocs d'organisation (Maternelle, Primaire, Moyen, Lycée).
- **`EducationalLevel`** : Échelons de progression (CP, CE1, 6ème...) rattachés à un Cycle via un `rank`.
- **`Filiere`** (Optionnel) : Spécialisation horizontale pour les niveaux (ex: Série S1, L1).
- **`SchoolClass`** : Instance physique d'enseignement (ex: CM2-A 2025-2026).

---

## 4. Contraintes Métier & Cohérence (Règles d'Or)

### 4.1 Temporalité
- **Chevauchement** : Deux années scolaires ne peuvent pas se chevaucher dans le temps.
- **Emboîtement** : Les périodes et les congés doivent être strictement inclus dans les dates de cours de l'année.
- **Unicité Active** : **Une seule année peut être au statut `ACTIVE`** à la fois par établissement.

### 4.2 Hiérarchie
- **Rank Unique** : Les cycles ont un rang unique. Les niveaux ont un rang unique par établissement (ex: CP=1, CE1=2...).
- **Roll-over** : Le `rank` des niveaux pilote la promotion automatique des élèves en fin d'année.

---

## 5. Catalogue exhaustif des Endpoints API

### 5.1 Gestion des Années Scolaires (`/api/v1/academic/years`)
| Méthode | Path | Rôle | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | ADMIN | Créer une année (Initiale: `PLANNING`). |
| `GET` | `/` | TOUS | Liste toutes les années. |
| `GET` | `/{id}` | TOUS | Détails complets d'une année. |
| `GET` | `/current` | TOUS | Récupère l'année actuellement `ACTIVE`. |
| `PATCH` | `/{id}/activate`| ADMIN | Active l'année (Archive l'ancienne active). |
| `PATCH` | `/{id}/close` | ADMIN | Passe en mode `CLOSING` (Fin des cours). |
| `PATCH` | `/{id}/reopen` | ADMIN | Repasse de `CLOSING` à `ACTIVE`. |
| `PATCH` | `/{id}/archive` | ADMIN | Passage définitif en `ARCHIVED` (Lecture seule). |

### 5.2 Gestion des Périodes (`/api/v1/academic/years/{yearId}/periods`)
| Méthode | Path | Rôle | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | ADMIN | Créer un trimestre ou semestre. |
| `GET` | `/` | TOUS | Liste les périodes de l'année. |
| `PUT` | `/{id}` | ADMIN | Modifier (libellé, dates d'examens). |
| `DELETE` | `/{id}` | ADMIN | Supprimer (si année non archivée). |

### 5.3 Gestion des Congés (`/api/v1/academic/years/{yearId}/holidays`)
| Méthode | Path | Rôle | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | ADMIN | Ajouter un congé ou des vacances. |
| `GET` | `/` | TOUS | Liste les congés de l'année. |
| `PUT` | `/{id}` | ADMIN | Modifier un congé. |
| `DELETE` | `/{id}` | ADMIN | Supprimer un congé. |

### 5.4 Référentiel des Cycles (`/api/v1/academic/cycles`)
| Méthode | Path | Rôle | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | ADMIN | Créer un cycle (ex: Primaire). |
| `GET` | `/` | TOUS | Liste les cycles triés par rang. |
| `PUT` | `/{id}` | ADMIN | Modifier un cycle. |
| `DELETE` | `/{id}` | ADMIN | Supprimer un cycle. |

### 5.5 Référentiel des Niveaux (`/api/v1/academic/levels`)
| Méthode | Path | Rôle | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | ADMIN | Créer un niveau (ex: CP). |
| `GET` | `/` | TOUS | Liste les niveaux (Inclus l'objet Cycle). |
| `PUT` | `/{id}` | ADMIN | Modifier un niveau (Changement de Cycle/Rank). |
| `DELETE` | `/{id}` | ADMIN | Supprimer un niveau. |

### 5.3 Référentiel des Filières (`/api/v1/academic/filieres`)
*   **URL :** `GET /filieres` | `POST /filieres`
*   **Usage :** Séries au Lycée ou spécialisations techniques (ex: S1, L1, G).
*   **Requête :**
    ```json
    {
      "name": "Série S1 - Sciences Exactes",
      "code": "S1"
    }
    ```

### 5.4 Gestion des Classes (`/api/v1/academic/classes`)
La Classe est l'union d'une Année, d'un Niveau et d'une Filière (optionnelle).
*   **URL :** `POST /classes` | `PUT /classes/{id}`
*   **Lister par année :** `GET /classes/by-year/{yearId}`
*   **Requête :**
    ```json
    {
      "academicYearId": "uuid",
      "levelId": "uuid",
      "filiereId": "uuid", // Optionnel pour le Tronc Commun
      "name": "A", // Suffixe de la classe
      "capacity": 35
    }
    ```
*   **Réponse :**
    ```json
    {
      "id": "uuid",
      "fullName": "CM2 A", // Nom complet reconstruit
      "name": "A",
      "levelName": "CM2",
      "filiereCode": null,
      "capacity": 35,
      "academicYearId": "...",
      "levelId": "...",
      "filiereId": null
    }
    ```
---

## 6. Guide d'Intégration Frontend (Angular)

### 6.1 Formats des Requêtes (Exemple Niveau)
```json
{
  "name": "CM2",
  "cycleId": "uuid-primaire",
  "rank": 6
}
```

### 6.2 Format de Réponse (Exemple Niveau)
```json
{
  "id": "uuid",
  "name": "CM2",
  "rank": 6,
  "cycle": {
    "id": "uuid-primaire",
    "name": "Primaire",
    "rank": 2
  }
}
```

### 6.3 Gestion de la "Checklist de Clôture"
L'endpoint `GET /years/{id}/closing-checklist` est prévu mais **NON IMPLÉMENTÉ** pour le moment. Il servira à valider la promotion des élèves avant archivage.

---

### 5.5 Gestion des Matières (`/api/v1/academic/subjects`)
Bibliothèque globale des matières de l'établissement.
*   **URL :** `GET /subjects` | `POST /subjects`
*   **Détails & Mise à jour :** `GET /subjects/{id}` | `PUT /subjects/{id}`
*   **Donnée :** `{ "name": "Mathématiques", "code": "MATH" }`

### 5.6 Programmes par Niveau (`/api/v1/academic/curriculum`)
Définit les matières obligatoires/optionnelles et les coefficients par défaut pour un niveau donné.
*   **Lister par niveau :** `GET /curriculum/by-level/{levelId}?filiereId=...`
*   **Détails & Mise à jour :** `GET /curriculum/{id}` | `PUT /curriculum/{id}`
*   **Ajouter une matière au programme :** `POST /curriculum`
*   **Requête (POST/PUT) :**
    ```json
    {
      "levelId": "uuid",
      "filiereId": "uuid", // Optionnel
      "subjectId": "uuid",
      "defaultCoefficient": 5.0,
      "maxScore": 20.0,
      "optional": false
    }
    ```

### 5.7 Enseignements en Classe (`/api/v1/academic/classes/{classId}/teachings`)
Affectation concrète des professeurs et des matières à une classe spécifique.
*   **Lister les cours d'une classe :** `GET /teachings`
*   **Détails & Mise à jour :** `GET /teachings/{id}` | `PUT /teachings/{id}`
*   **Assigner un enseignant :** `POST /teachings`
*   **Requête (POST/PUT) :**
    ```json
    {
      "subjectId": "uuid",
      "teacherId": "uuid-du-prof-identity",
      "coefficient": 5.0,
      "maxScore": 20.0
    }
    ```

## 7. Intégration Inter-Services (Personnel)

### 7.1 Récupérer la liste des enseignants
Pour assigner un professeur à une classe (section 5.7), le Frontend doit d'abord récupérer les IDs depuis le **Identity Service**.
*   **URL :** `GET /api/v1/users?type=TEACHER`
*   **Usage :** Alimenter la liste déroulante des professeurs dans le formulaire d'enseignement.

---

## 7. Audit & Traçabilité
Chaque action sensible génère une entrée dans la table `academic_audit_logs` :
- `CLASS_CREATED`, `YEAR_ACTIVATED`, `HOLIDAY_ADDED`, etc.
- Tracé avec `actor_email`, `timestamp` et `description`.
