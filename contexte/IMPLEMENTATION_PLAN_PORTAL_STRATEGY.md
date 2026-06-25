# Plan d'Implémentation : Portail Public "Configuration-Driven"

Ce document détaille les étapes techniques pour implémenter la stratégie de contrôle total du portail par l'établissement.

---

## Phase 1 : Refonte du Modèle de Configuration (Socle)
L'objectif est de transformer `EnrollmentConfig` en un objet de pilotage complet et contextuel.

1.  **Enrichissement du Domaine (`EnrollmentConfig.java`)** :
    *   **Configuration Globale** : `portalActive`, `instructions`, `legalText`.
    *   **Configuration par Défaut** : `defaultChecklist`, `defaultFormSchema`, `defaultCoreOverrides`.
    *   **Overrides par Niveau (`levelOverrides`)** : Une Map (Key: `levelId`) permettant de surcharger la checklist ou le formulaire pour un niveau spécifique (ex: Maternelle vs Lycée).
2.  **Mise à jour de la Persistance** :
    *   Migration Flyway (`V6__upgrade_enrollment_config.sql`) : Evolution de la structure JSONB pour supporter la hiérarchie Défaut / Overrides.
3.  **Mise à jour du Mapper** : Assurer la fusion (Merge) entre la config par défaut et l'override éventuel lors de la lecture.

---

## Phase 2 : Logique de Contrôle Métier (Validation)
Implémenter les verrous de sécurité basés sur la configuration.

1.  **Le Verrou "Master Switch"** :
    *   Modifier `ApplicationService.create()` pour vérifier si `portalActive == true`.
    *   Lever une `IllegalStateException` personnalisée si le portail est fermé.
2.  **Le Verrou "Core Fields"** :
    *   Créer un validateur qui s'assure que les champs marqués `mandatory: true` dans `coreFieldOverrides` sont bien présents lors de la mise à jour du candidat.
3.  **Initialisation Intelligente** :
    *   Lors de la création d'un nouveau Tenant, générer une `EnrollmentConfig` par défaut avec tous les champs du "Noyau Dur" activés.

---

## Phase 3 : Intégration Inter-Services (Intelligence)
Connecter les flux de données pour automatiser le contrôle.

1.  **Synchronisation Temporelle** :
    *   Utiliser le `AcademicServiceClient` (OpenFeign) pour fusionner le statut `portalActive` local avec les dates d'Academic.
    *   Règle : `isSubmitAllowed = local.portalActive && academic.isRegistrationOpen`.
2.  **Gestion des Quotas** :
    *   Implémenter l'appel `GET /availability` vers Academic Structure.
    *   Si le quota est atteint, changer dynamiquement le message du tracker pour le parent.

---

## Phase 4 : Contrat d'Interface Frontend (Angular)
Définir comment Angular doit consommer cette nouvelle puissance.

1.  **Modèle de Vue Dynamique** :
    *   Le frontend appelle `GET /admin/config` au démarrage.
    *   Il boucle sur `coreFieldOverrides` pour générer les labels et les validations `Validators.required`.
    *   Il affiche les `instructions` au-dessus de chaque bloc de catégorie.

---

## Calendrier d'Exécution (Sprint feature/enrollment-portal-strategy)
1.  **Jour 1** : Phase 1 (Domaine, SQL, Mappers).
2.  **Jour 2** : Phase 2 (Logique Master Switch et Validations).
3.  **Jour 3** : Phase 3 (Lien Quotas et Temporalité réelle).
4.  **Jour 4** : Tests unitaires et Bruno de validation.

---
*Architecte Feewi - Mars 2026*
