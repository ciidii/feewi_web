# Plan d'Implémentation Frontend : Feewi (Ecosystème Shell)

Ce document détaille la stratégie technique et l'ordre d'exécution pour la mise en place de l'interface Feewi, basée sur les spécifications `FRONTEND_SPEC.md`.

## Phase 1 : Fondations & Design System (Le Socle) - ✅ TERMINÉE
*Objectif : Établir l'infrastructure visuelle et technique conforme au style Google Workspace.*

- [x] **Dépendances & Tooling :** Installation de Material 3, Tailwind v4, et Lucide Angular.
- [x] **Configuration du Thème :** Mise en place des Design Tokens (Midnight Slate) et intégration PostCSS pour Tailwind v4.
- [x] **Architecture de Dossiers :** Migration vers le pattern **Domain-Driven Contexts** (`public`, `saas-admin`, `school-app`).

## Phase 2 : Le Shell & La Navigation (L'Orchestration) - ✅ TERMINÉE
*Objectif : Créer le cadre permanent de l'application (Le Shell).*

- [x] **Services de Structure :** `NavigationStateService` (Sidebar) et `NavigationContextService` (Domaines).
- [x] **Navigation Contextuelle :** Séparation absolue des interfaces Super Admin (SaaS) et École (Métier).
- [x] **Composants du Shell :** Header (Omnisearch + Sélecteur d'année), App Rail stable et Sidebar contextuelle.

## Phase 3 : Composants Partagés & Framework UI - ✅ TERMINÉE
*Objectif : Standardiser les interactions pour une réutilisation maximale.*

- [x] **DataListComponent (Gmail-style) :**
    - Pattern "One-line" ultra-pro avec actions groupées et hover overlay.
    - Support des onglets sémantiques avec icônes et compteurs.
- [x] **FluidDetailViewPattern :** Layout expert pour la consultation de fiches avec barre de pilotage supérieure fixe.

## Phase 4 : Intégration Identity & Provisioning (SaaS Level) - 🔄 EN COURS
*Objectif : Connecter le backend et outiller le Super Administrateur.*

- [x] **Infrastructure Core :**
    - [x] `AuthService` : Connexion réelle API et gestion du signal `currentUser`.
    - [x] `AuthInterceptor` : Injection automatique du `Bearer access_token`.
    - [x] `SchoolService` : Service métier pour le provisioning `/schools`.
- [x] **Provisioning SaaS :**
    - [x] `TenantManager` : Pilotage des écoles via le composant `DataList`.
    - [x] `TenantForm` : Formulaire expert (Reactive Forms) avec validation temps réel et feedback visuel premium.
- [ ] **Sécurité & RBAC :**
    - [ ] `CanMatch` Guards : Isolation physique des bundles par rôle (SaaS vs École).
    - [ ] Gestion des permissions granulaires dans l'UI.

## Phase 5 : Métier École & Workflow (Registry Level) - 📅 À VENIR
*Objectif : Déployer le cœur de valeur pour les établissements.*

- [ ] **Scolarité (Registry) :** Gestion des Classes, Niveaux et Référentiel Élèves.
- [ ] **Admissions :** Finalisation de l'intégration réelle (POST/PUT) pour le workflow d'inscription.
- [ ] **Profil Utilisateur :** Paramètres personnels et sécurité du compte.
