# Guide de Migration Backend : API & Structure Académique (v2)

> **Cible :** Équipe Backend & Frontend
> **Contexte :** Passage d'un modèle d'Année Scolaire rigide à un modèle de "Timeline par Jalons".

## 1. Résumé du Changement
L'entité `AcademicYear` a été simplifiée pour ne devenir qu'un conteneur temporel global. Toute la logique spécifique (Inscriptions, Cours, Examens) a été extraite vers une nouvelle entité dédiée : **`AcademicMilestone`** (Jalons).

---

## 2. Changements de Contrat d'API (Breaking Changes)

### 2.1 Entité `AcademicYear`
Les dates spécifiques ont été supprimées des endpoints `POST`, `PUT` et `GET` au profit de deux dates génériques : `startDate` et `endDate`.

**Champs Supprimés :**
*   `adminStartDate` (Renommé en `startDate`)
*   `adminEndDate` (Renommé en `endDate`)
*   `registrationStartDate` (SUPPRIMÉ)
*   `registrationEndDate` (SUPPRIMÉ)
*   `lessonsStartDate` (SUPPRIMÉ)
*   `lessonsEndDate` (SUPPRIMÉ)

**Nouvel Objet de Création (Exemple) :**
```json
{
  "label": "2026-2027",
  "systemType": "TRIMESTER",
  "startDate": "2026-07-01",
  "endDate": "2027-06-30"
}
```

### 2.2 Endpoints Supprimés
*   `GET /api/v1/academic/years/{id}/registration-status` : Supprimé car la logique de date d'inscription n'appartient plus au module Académique de cette manière.

---

## 3. Nouveau Concept : Les Jalons (Milestones)

Pour définir les périodes d'inscription ou de cours, il faut désormais utiliser le `MilestoneController`.

### 3.1 Créer un Jalon
*   **URL :** `POST /api/v1/academic/years/{yearId}/milestones`
*   **Payload :**
    ```json
    {
      "type": "ENROLLMENT", // ou LESSONS, EXAMS, RE_ENROLLMENT, VACATION
      "label": "Campagne d'Admission 2026",
      "startDate": "2026-03-01",
      "endDate": "2026-06-30"
    }
    ```

### 3.2 Lister les Jalons
*   **URL :** `GET /api/v1/academic/years/{yearId}/milestones`

---

## 4. Impact Inter-Services (Enrollment)

Le service `enrollment-service` a été mis à jour pour être plus autonome :
1.  Il ne demande plus "Est-ce que l'année est ouverte ?" au service Académique via les anciennes colonnes.
2.  **Règle de résolution :**
    *   Si un `YearOverride` local existe (dans Enrollment), c'est la priorité absolue.
    *   Sinon, il considère l'année ouverte par défaut si son statut est `PLANNING` ou `ACTIVE`.
    *   *(À venir)* : Il consultera le jalon `ENROLLMENT` du service Académique comme valeur de référence.

---

## 5. Migration de la Base de Données

Les scripts Flyway suivants doivent être exécutés (Automatique au démarrage) :
*   **`V17__Simplify_Academic_Year.sql`** : Renomme les colonnes de base et supprime les colonnes de milestones redondantes.
*   **`V18__Add_Academic_Milestones.sql`** : Crée la nouvelle table `academic_milestones`.

---

## 6. Actions pour le Frontend (Angular)
1.  Mettre à jour les formulaires de création/édition d'année scolaire (simplifier les champs de date).
2.  Implémenter le nouvel écran de "Gestion du Calendrier" qui utilise l'API des Milestones.
3.  Retirer les appels vers `/registration-status`.

---
*Rédigé par l'Architecture Feewi - Mai 2026*
