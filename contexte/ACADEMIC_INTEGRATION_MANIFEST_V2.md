# Manifeste d'Intégration : Structure Académique & Chronologie v2

Ce document est la référence absolue pour l'intégration du nouveau module temporel de Feewi. Il synthétise les changements majeurs, les contrats d'API et les flux de travail pour les équipes Backend et Frontend.

---

## 1. Vision : La Chronologie Centralisée
Feewi abandonne le modèle rigide des années scolaires figées pour un modèle de **Timeline par Jalons (Milestones)**. 
- **L'Année Scolaire** est un conteneur global (`startDate` -> `endDate`).
- **Les Jalons** portent l'intelligence métier (Inscriptions, Cours, Examens, Vacances).

---

## 2. Contrats d'API (Modifications Majeures)

### 2.1 Année Scolaire (`AcademicYear`)
Les champs de dates spécifiques (`admin*`, `registration*`, `lessons*`) ont été **supprimés**.

**Nouveau DTO de référence :**
```json
{
  "id": "UUID",
  "label": "2026-2027",
  "status": "PLANNING|ACTIVE|ARCHIVED",
  "systemType": "TRIMESTER|SEMESTER",
  "startDate": "2026-07-01",
  "endDate": "2027-06-30"
}
```

### 2.2 Nouveau : Les Jalons (`AcademicMilestone`)
Tout le calendrier de l'école est désormais géré via cet endpoint.

*   **Lister :** `GET /api/v1/academic/years/{yearId}/milestones`
*   **Ajouter :** `POST /api/v1/academic/years/{yearId}/milestones`
*   **Types supportés :** `ENROLLMENT`, `RE_ENROLLMENT`, `LESSONS`, `EXAMS`, `VACATION`.

---

## 3. Automatisation : La "Factory"
Pour simplifier la vie des directeurs, nous avons introduit un moteur de génération automatique.

### 3.1 Génération par Template (National)
Copie le calendrier officiel d'un pays (ex: Sénégal) vers l'année scolaire de l'école.
*   **URL :** `POST /api/v1/academic/years/{id}/generate-calendar?strategy=TEMPLATE&templateCode=SN_OFFICIAL_2026_2027`

### 3.2 Génération Automatique (Mathématique)
Découpe l'année en trimestres/semestres égaux selon le `systemType` choisi.
*   **URL :** `POST /api/v1/academic/years/{id}/generate-calendar?strategy=AUTO`

---

## 4. Intégration Inter-Services (Enrollment)

Le service `enrollment-service` est désormais un **consommateur intelligent** :
1.  **Priorité 1** : Il vérifie s'il existe une surcharge locale (`YearOverride`) dans sa propre config.
2.  **Priorité 2** : Il interroge le module Académique pour trouver le jalon de type `ENROLLMENT`.
3.  **Défaut** : Si aucun jalon n'est défini, il considère l'année ouverte (si statut ACTIVE/PLANNING).

**Impact Intégration :** Le Frontend ne doit plus demander le "statut d'inscription" au module Académique, mais interroger le `PublicConfigService` du module Enrollment qui fait désormais la synthèse.

---

## 5. Guide de Mise en Œuvre (Workflow Recommandé)

Pour configurer une nouvelle année scolaire, le Frontend devrait suivre ce flux :
1.  **Créer l'Année** (`POST /years`) avec uniquement les dates de début et de fin globales.
2.  **Proposer la Génération** : Demander à l'utilisateur s'il veut "Importer le calendrier officiel" ou "Générer automatiquement".
3.  **Ajuster** : Permettre à l'utilisateur de modifier ou supprimer certains jalons générés via l'API des Milestones.

---

## 6. Historique des Migrations (Flyway)
*   **V17** : Simplification de la table `academic_years`.
*   **V18** : Création de la table `academic_milestones`.
*   **V19** : Insertion des données modèles (Templates nationaux).
*   **V20** : Script de migration défensif pour transfert des anciennes données.

---
*Validé par l'Architecture Feewi - Mai 2026*
