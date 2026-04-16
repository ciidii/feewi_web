# Agent : Frontend Angular Expert

> Spécialiste du `feewi_web` — frontend Angular de Feewi.

---

## Stack Technique

- **Framework :** Angular 17+ (Standalone Components)
- **Styles :** Tailwind CSS
- **Typage :** TypeScript strict
- **Build :** Angular CLI

---

## Structure du Projet

```
src/app/
├── core/                      # Services, guards, interceptors globaux
│   ├── constants/
│   ├── guards/                # Auth guards (isAuthenticated, hasRole, etc.)
│   ├── interceptors/          # HTTP interceptors (JWT, tenant, error handling)
│   ├── layout/                # Shell de l'application (nav, sidebar)
│   ├── models/                # Modèles TypeScript globaux
│   └── services/              # Services globaux (auth, config)
│
├── domains/                   # Modules par domaine fonctionnel
│   ├── public/                # Portail public (non authentifié)
│   │   ├── auth/              # Login, register
│   │   └── enrollment/        # Formulaire d'admission en ligne (parents)
│   │
│   ├── school-app/            # Application de l'école (authentifié)
│   │   └── features/          # Fonctionnalités par module métier
│   │
│   └── saas-admin/            # Administration SaaS (super admin)
│       ├── tenant-manager/    # Liste des écoles
│       ├── tenant-form/       # Création école
│       ├── tenant-edit-form/  # Modification école
│       ├── tenant-detail/     # Détail école
│       ├── saas-stats/        # Statistiques plateforme
│       └── global-audit/      # Logs d'audit global
│
└── shared/                    # Composants, directives, pipes réutilisables
    ├── components/
    ├── directives/
    ├── models/
    ├── pipes/
    └── services/
```

---

## Architecture Domaine

### Public (`/public`)
- Portail sans authentification
- **Enrollment Wizard** : formulaire multi-étapes pour les parents (Bundle famille + enfant par enfant)
- Suivi de dossier via `accessCode`

### School App (`/app`)
- Application principale de l'école (Secrétariat + Direction)
- Auth JWT requise
- Features par microservice backend

### SaaS Admin (`/admin`)
- Super-administration de la plateforme
- Gestion des tenants (écoles)

---

## Conventions de Code

- **Composants :** Standalone (`standalone: true`), pas de NgModules
- **Routing :** Lazy loading par domaine via `loadChildren`
- **Services HTTP :** Dans `core/services/` ou `domain/services/` selon le scope
- **Modèles :** Interfaces TypeScript, jamais de classes pour les DTOs
- **Formulaires :** Reactive Forms (`FormGroup`, `FormControl`) — pas de template-driven
- **Styles :** Tailwind utility classes en priorité, SCSS uniquement pour les cas complexes

---

## Interceptors

| Interceptor | Rôle |
|---|---|
| JWT Interceptor | Ajoute le `Authorization: Bearer <token>` à chaque requête |
| Tenant Interceptor | Ajoute `X-Tenant-ID` header |
| Error Interceptor | Gestion globale des erreurs HTTP (401 → redirect login, 403 → forbidden page) |

---

## Guards

| Guard | Condition |
|---|---|
| `isAuthenticated` | Token JWT valide et non expiré |
| `hasRole` | Vérifie le rôle dans le JWT (`DIRECTION`, `SECRETARIAT`) |

---

## Communication avec les Backends

- **Base URL** : via `environment.ts` (`apiUrl`, `gatewayUrl`)
- **Tous les appels** passent par l'API Gateway (`localhost:8080`)
- Routes backend :
  - `/api/v1/auth/**` → identity-service
  - `/api/v1/admissions/**` → enrollment-service
  - `/api/v1/students/**` → student-registry-service

---

## Points d'Attention

- **Multi-tenant** : Le `tenant_id` est dans le JWT — l'interceptor l'extrait et l'ajoute en header
- **Enrollment Wizard** : C'est le composant le plus complexe — il doit gérer N enfants dans un même bundle, avec des étapes dynamiques
- **Standalone Components** : Ne pas réintroduire de NgModules
- **Tailwind** : Pas de CSS inline, toujours des classes Tailwind
