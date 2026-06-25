# Feewi Web - Système de Gestion Scolaire SaaS

## 🌟 Présentation
**Feewi** (du Pulaar *"C'est en ordre"*) est une solution SaaS de gestion administrative scolaire moderne, conçue pour les établissements privés. Ce dépôt contient le **Frontend** de l'application, développé avec une architecture robuste pour supporter le multi-tenant et la montée en charge.

Ce document sert de guide principal pour les agents IA et les développeurs souhaitant contribuer au projet.

---

## 🛠️ Stack Technique
- **Framework :** [Angular 20+](https://angular.dev/) (Standalone Components, Signals-ready).
- **Style :** [Tailwind CSS 4+](https://tailwindcss.com/) & [Angular Material](https://material.angular.io/).
- **Icônes :** [Lucide Angular](https://lucide.dev/guide/packages/lucide-angular).
- **i18n :** [ngx-translate](https://github.com/ngx-translate/core) (Support FR/EN).
- **Communication :** REST API avec intercepteurs pour la gestion du JWT et du `tenant_id`.
- **Qualité :** Prettier pour le formatage, Jasmine/Karma pour les tests.

---

## 🏗️ Architecture du Projet

### Organisation des dossiers (`src/app/`)
- **`core/` :** Le "cerveau" de l'application. Contient les services globaux, guards, intercepteurs et modèles transversaux.
- **`shared/` :** Composants atomiques (`fw-*`), directives, et pipes réutilisables dans tous les domaines.
- **`domains/` :** Logique métier découpée par périmètre :
    - `public/` : Portail d'admission pour les parents.
    - `school-app/` : Interface pour le secrétariat et la direction des écoles.
    - `saas-admin/` : Administration globale de la plateforme Feewi.
- **`layout/` :** Composants de structure (Shell, Sidebar, Header, Rail).

### Concepts Clés
1. **Multi-tenancy :** Chaque requête API inclut automatiquement un header `X-Tenant-ID` via le `tenant.interceptor.ts`.
2. **RBAC (Role Based Access Control) :** Les droits sont gérés via des permissions granulaires contenues dans le JWT.
3. **Design Tokens :** Les styles respectent un système de tokens (`src/styles/_tokens.scss`) pour assurer la cohérence visuelle.

---

## 📚 Ressources & Documentation
Pour une compréhension approfondie, consultez le dossier `contexte/` :
- `ARCHITECTURE.md` : Vision globale du système (Note: Bien que le document mentionne React, l'implémentation actuelle est Angular).
- `API_WORKFLOW.md` : Détails sur la communication avec les microservices.
- `DESIGN_GUIDELINES.md` : Principes d'interface et d'expérience utilisateur.

---

## 🤖 Guide pour l'Agent IA
Lors de tes interventions, respecte les règles suivantes :
1. **Surgical Edits :** Utilise l'outil `replace` pour des modifications précises.
2. **Idiomatic Angular :** Utilise les dernières fonctionnalités d'Angular (Signals, `inject()`, standalone components).
3. **Tailwind First :** Préfère les classes utilitaires Tailwind au CSS personnalisé, sauf pour l'utilisation des tokens.
4. **i18n :** Toute chaîne de caractères visible par l'utilisateur doit passer par `TranslatePipe` ou `TranslateService`.
5. **Types :** Assure-toi que chaque modèle et service est strictement typé dans `core/models`.

---

## 🚀 Commandes Utiles
```bash
npm install        # Installation des dépendances
npm start          # Lancement en mode dev (http://localhost:4200)
npm run build      # Build de production
npm test           # Exécution des tests unitaires
```
