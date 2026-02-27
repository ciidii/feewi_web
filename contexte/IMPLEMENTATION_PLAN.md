# Plan d'Implémentation Frontend : Feewi (Ecosystème Shell)

Ce document détaille la stratégie technique et l'ordre d'exécution pour la mise en place de l'interface Feewi, basée sur les spécifications `FRONTEND_SPEC.md`.

## Phase 1 : Fondations & Design System (Le Socle)
*Objectif : Établir l'infrastructure visuelle et technique conforme au style Google Workspace.*

- [ ] **Dépendances & Tooling :**
    - Installation de `@angular/material` (Support M3).
    - Configuration de `tailwindcss`, `postcss`, et `lucide-angular`.
- [ ] **Configuration du Thème M3 & Tailwind :**
    - Création du thème Material 3 personnalisé via `@mat.theme`.
    - Extension de `tailwind.config.js` avec la palette "Midnight Slate" (Indigo/Slate) et polices `Lexend` (Display) / `Inter` (Sans).
    - Mise en place des Design Tokens (CSS Variables) pour le Dynamic Branding.
- [ ] **Architecture de Dossiers (Pattern LIFT) :**
    - `src/app/core/` : Services singletons (Auth, TenantContext, Interceptors).
    - `src/app/shared/` : Composants UI atomiques (Buttons, SmartDataList, Layouts).
    - `src/app/features/` : Modules métiers (Admissions, Scolarité, Admin).

## Phase 2 : Le Shell & La Navigation (L'Orchestration)
*Objectif : Créer le cadre permanent de l'application (Le Shell).*

- [ ] **Services de Structure (Signals-based) :**
    - `NavigationStateService` : État `expanded/collapsed` de la sidebar et fil d'ariane.
    - `TenantContextService` : Gestion du `tenantId` actif, logo et injection du branding.
- [ ] **Composants du Shell :**
    - `ShellComponent` : Composant racine orchestrant le Header, le Rail et la Sidebar.
    - `HeaderComponent` : Omnisearch (Ctrl+K) et App Launcher (Gaufrier).
    - `AppRailComponent` : Navigation verticale étroite (64px) pour les icônes de haut niveau.
    - `ContextualSidebarComponent` : Navigation interne du module avec le **Bouton d'Action Primaire (Hero Button)**.

## Phase 3 : Composants Génériques "Workspace" (Le Framework UI)
*Objectif : Standardiser les interactions pour une réutilisation maximale.*

- [ ] **BaseDataTableComponent (Smart Data-List) :**
    - Implémentation du pattern "Gmail-style" : Leading (Avatar/Checkbox), Body (Primary/Secondary), Badges, et Hover Actions.
    - Gestion de la pagination et du filtrage via TanStack Query ou Angular Signals.
- [ ] **FluidDetailViewPattern :**
    - Layout pour la consultation de fiches (ex: Dossier n°123).
    - Barre de pilotage supérieure avec navigation séquentielle (`<` `>`) et actions atomiques.

## Phase 4 : Modules Métiers & Sécurité (La Logique)
*Objectif : Déployer les premières fonctionnalités métier.*

- [ ] **Sécurité & Interception :**
    - `TenantInterceptor` : Injection automatique des headers `Authorization` et `X-Tenant-ID`.
    - Pages d'Auth (Login, Reset Password) et Tenant Switcher.
- [ ] **Features MVP :**
    - **SaaS Admin** : Gestion des établissements (Tenants) et licences.
    - **Registry (Scolarité)** : Gestion du référentiel élèves avec le pattern Smart Data-List.
