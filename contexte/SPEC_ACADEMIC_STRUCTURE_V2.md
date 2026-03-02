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

## 7. Audit & Traçabilité
Chaque action sensible génère une entrée dans la table `academic_audit_logs` :
- `CLASS_CREATED`, `YEAR_ACTIVATED`, `HOLIDAY_ADDED`, etc.
- Tracé avec `actor_email`, `timestamp` et `description`.
