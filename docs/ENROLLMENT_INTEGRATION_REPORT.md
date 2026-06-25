# Rapport d'Intégration Technique : Enrollment Service (Admissions)

Ce document résume les travaux d'intégration réalisés sur le module Enrollment dans le cadre de l'écosystème Feewi Web.

---

## 1. Vue d'Ensemble
L'intégration du module **Enrollment** a été réalisée en respectant une architecture découplée, séparant l'expérience publique (Portail Parents) de l'interface administrative (Secrétariat/Direction). L'objectif prioritaire était d'offrir une expérience utilisateur moderne ("User-First") tout en garantissant une synchronisation rigoureuse avec les APIs microservices.

## 2. Conformité API (Synchronisation des Endpoints)

Nous avons aligné le frontend sur les contrats d'interface décrits dans la documentation technique. Chaque étape du formulaire communique avec un endpoint spécifique pour garantir la persistance des données.

| Étape Fonctionnelle | Méthode HTTP | Endpoint API | Rôle Technique |
| :--- | :--- | :--- | :--- |
| **Initialisation** | `POST` | `/public/applications` | Création du dossier avec Lead Capture (Tuteur). |
| **Parcours & Identité** | `PATCH` | `/applications/{id}/candidate` | Envoi groupé : Identité enfant + Niveau + Filière. |
| **Gestion des Tuteurs** | `PATCH` | `/applications/{id}/guardians` | Mise à jour des coordonnées et profession des responsables. |
| **Dépôt de Pièces** | `POST` | `/applications/{id}/documents/{code}` | Téléversement direct des pièces justificatives. |
| **Soumission Finale** | `POST` | `/applications/{id}/submit` | Verrouillage du dossier pour traitement interne. |
| **Suivi (Tracker)** | `GET` | `/applications/{ref}/track` | Suivi en temps réel sécurisé par AccessCode. |

## 3. Innovations UX & Robustesse

### A. Mécanisme de "Reprise Magique" (Persistence)
*   **Service dédié :** `AdmissionSessionService`.
*   **Fonctionnement :** Stockage en `LocalStorage` du triplet `reference` + `accessCode` + `currentStep`.
*   **Bénéfice :** Reconnaissance automatique du parent. S'il revient après avoir fermé son navigateur, il est redirigé exactement à l'étape où il s'était arrêté, avec ses données synchronisées depuis le serveur.

### B. Le "Zen Stepper" (Parcours Parent)
*   **Workflow optimisé :** Passage à un flux à 4 étapes fluides pour réduire la charge cognitive.
*   **Auto-save atomique :** Aucune perte de données grâce à la sauvegarde systématique lors du clic sur "Suivant".
*   **Checklist dynamique :** La liste des documents à fournir s'adapte automatiquement à la configuration de l'école et au niveau sélectionné.

### C. Interface Administrative (Back-office)
*   **Vue Side-by-Side :** Layout 60/40 permettant de consulter le formulaire et les documents simultanément sans changer de page.
*   **Module d'Évaluation :** Grille de saisie des notes avec calcul de moyenne en temps réel via Angular Signals.
*   **Réinscription Simplifiée :** Interface optimisée pour le secrétariat permettant de réinscrire un élève existant en quelques secondes.

## 4. Architecture Logicielle

*   **Modélisation :** Typage strict via interfaces et enums (`enrollment.model.ts`).
*   **Services :**
    *   `EnrollmentPublicService` : Gestion des flux anonymes (X-Tenant-Id).
    *   `EnrollmentAdminService` : Opérations back-office sécurisées (JWT).
*   **Routing :** Mise en place d'une structure de redirection professionnelle (`AuthLayout`, `EnrollmentLayout`) pour éliminer les pages blanches et les erreurs 404.

---
*Rapport validé par l'Équipe Engineering - 24 Mars 2026*
