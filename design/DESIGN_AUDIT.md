# Feewi — Audit Design & Plan d'Action

> Résultat de la revue design d'avril 2026.  
> Ce document est le pont entre la vision (`DESIGN_SYSTEM_VISION.md`) et le code.

---

## État au 2026-07-11

La quasi-totalité des composants atomiques listés ci-dessous ont été livrés depuis cette revue,
puis étendus lors de l'audit approfondi consigné dans `UI_UX_STRATEGY.md` (qui fait foi pour l'état
détaillé le plus récent — tabs, cartes, formulaires, toggles). Résumé :

- **1.2 `fw-button`** — livré, utilisé partout.
- **1.3 `fw-badge`** — livré, utilisé partout.
- **2.1/2.2 Input unifié (`.fw-field`/`.fw-label`/`.fw-input`/`.fw-hint`)** — livré. `.fw-input` et
  `.fw-hint` ont d'abord été ajoutés en tant que styles imbriqués (`.fw-input-wrapper .fw-input`)
  sans exister en règle de premier niveau, ce qui les rendait inopérants dans plusieurs formulaires
  utilisant `.fw-input` seul ; corrigé (voir `UI_UX_STRATEGY.md`).
- **3.1 Empty state (`fw-empty-state`)** — livré.
- **5.1 Header de page unifié** — **obsolète tel que décrit** : le header global de l'application a
  depuis été supprimé entièrement (recherche déplacée vers `page-header`, notifications/profil vers
  `app-rail`). Le pattern `page-shell`/`page-header` actuel remplace cette section.
- **5.2 `fw-tabs`** — livré (`shared/components/tabs`), mais l'architecture finale retenue diffère
  de "un seul composant qui remplace tous les usages à l'identique" : deux mécanismes coexistent
  intentionnellement — `FwTab` (identité par `id`) pour la navigation au niveau `page-shell`, et
  `TabItem` (identité par `label`) pour les filtres au niveau table/liste (`list-command-bar` ou
  `table-view`). Voir `UI_UX_STRATEGY.md` pour la décision détaillée.
- **Phase 4 (portail parent mobile / upload / consentement)** — non traitée dans cette session,
  reste à faire.

---

## Résumé exécutif

L'application Feewi dispose d'une **base solide** : palette cohérente, bonne typographie, composants partagés utiles (`form-shell`, `confirm-dialog`, `data-list`). Le portail d'inscription est particulièrement bien travaillé visuellement.

Les **problèmes principaux** sont structurels, pas esthétiques :
- L'absence d'une couche sémantique dans les tokens oblige à hardcoder des valeurs
- L'absence de composants atomiques (`button`, `badge`, `input`) crée de la dérive à chaque nouvelle feature
- Les états interactifs (focus, disabled) sont traités de manière incohérente

**Bonne nouvelle :** aucune refonte complète n'est nécessaire. Des ajouts ciblés suffisent.

---

## Phase 1 — Fondations (sans toucher au code applicatif)

*Objectif : poser les bases sans rien casser. Ces changements sont invisibles à l'utilisateur.*

### 1.1 Enrichir les tokens sémantiques

**Fichier :** `src/styles/_tokens.scss`

Ajouter après les tokens existants :

```scss
:root {
  /* --- SURFACES --- */
  --fw-surface-page     : var(--fw-ice);
  --fw-surface-card     : var(--fw-white);
  --fw-surface-sunken   : #f1f5f9;       /* fond d'input, zone encadrée */
  --fw-surface-inverse  : var(--fw-midnight);

  /* --- TEXTE --- */
  --fw-text-primary     : var(--fw-midnight);
  --fw-text-secondary   : #475569;
  --fw-text-tertiary    : #94a3b8;
  --fw-text-placeholder : #94a3b8;
  --fw-text-inverse     : #ffffff;
  --fw-text-link        : var(--fw-primary);

  /* --- STATUTS MÉTIER --- */
  --fw-success          : #10b981;
  --fw-success-bg       : #f0fdf4;
  --fw-success-border   : #a7f3d0;
  --fw-warning          : #f59e0b;
  --fw-warning-bg       : #fffbeb;
  --fw-warning-border   : #fde68a;
  --fw-error            : #ef4444;
  --fw-error-bg         : #fef2f2;
  --fw-error-border     : #fecaca;
  --fw-info             : #3b82f6;
  --fw-info-bg          : #eff6ff;
  --fw-info-border      : #bfdbfe;
  --fw-neutral          : #64748b;
  --fw-neutral-bg       : #f8fafc;
  --fw-neutral-border   : #e2e8f0;

  /* --- MOUVEMENTS --- */
  --fw-transition-fast  : 150ms ease;
  --fw-transition       : 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --fw-transition-slow  : 400ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Impact :** Aucun. Ajoute des variables sans en supprimer.

---

### 1.2 Créer `fw-button` — le composant atomique le plus urgent

**Chemin :** `src/app/shared/components/button/`

**Variantes nécessaires :**
```
primary    → bg-midnight text-white          (action principale)
secondary  → bg-slate-100 text-slate-700     (action secondaire)
ghost      → transparent text-slate-600      (navigation, retour)
danger     → bg-red-600 text-white           (action destructive)
```

**Tailles :**
```
sm   → h-8  px-3  text-xs    (actions inline dans les tableaux)
md   → h-10 px-4  text-sm    (défaut — formulaires, cartes)
lg   → h-12 px-6  text-base  (CTA de page)
```

**API du composant :**
```typescript
@Input() variant: 'primary' | 'secondary' | 'ghost' | 'danger' = 'primary';
@Input() size: 'sm' | 'md' | 'lg' = 'md';
@Input() loading = false;
@Input() disabled = false;
@Input() icon?: any;           // Lucide icon name
@Input() iconPosition: 'left' | 'right' = 'left';
```

**Template simplifié :**
```html
<button [class]="classes()" [disabled]="disabled || loading">
  <lucide-icon *ngIf="loading" [name]="Loader2" class="animate-spin"></lucide-icon>
  <lucide-icon *ngIf="!loading && icon && iconPosition === 'left'" [name]="icon"></lucide-icon>
  <ng-content></ng-content>
  <lucide-icon *ngIf="!loading && icon && iconPosition === 'right'" [name]="icon"></lucide-icon>
</button>
```

---

### 1.3 Créer `fw-badge` — statuts métier

**Chemin :** `src/app/shared/components/badge/`

Les statuts d'admission (DRAFT, SUBMITTED, VERIFIED...) sont affichés dans 6 endroits différents. Un seul composant doit gérer ça.

**API :**
```typescript
@Input() status!: AdmissionStatus | 'ACTIVE' | 'SUSPENDED' | string;
@Input() size: 'xs' | 'sm' = 'sm';
```

**Mapping statut → token :**
```typescript
const statusMap = {
  DRAFT:      { label: 'Brouillon',    token: 'neutral' },
  SUBMITTED:  { label: 'Soumis',       token: 'info'    },
  VERIFIED:   { label: 'Vérifié',      token: 'info'    },
  TESTING:    { label: 'En évaluation',token: 'warning' },
  ADMITTED:   { label: 'Admis',        token: 'success' },
  VALIDATED:  { label: 'Validé',       token: 'success' },
  WAITLIST:   { label: 'Liste attente',token: 'warning' },
  REJECTED:   { label: 'Rejeté',       token: 'error'   },
  CANCELLED:  { label: 'Annulé',       token: 'neutral' },
  ACTIVE:     { label: 'Actif',        token: 'success' },
  SUSPENDED:  { label: 'Suspendu',     token: 'error'   },
};
```

---

## Phase 2 — Cohérence des formulaires

*Objectif : tous les inputs ont le même look. Aujourd'hui ils varient entre pages.*

### 2.1 Style d'input unifié

**Spec visuelle :**
```
Hauteur          : 44px (md) / 36px (sm)
Fond             : --fw-surface-sunken (#f1f5f9)
Bordure          : 1.5px solid --fw-border
Bordure au focus : 1.5px solid --fw-primary
Rayon            : --fw-radius-sm (4px) pour cohérence avec les tables
Typographie      : 14px / font-medium
Padding          : 0 12px
```

**Ce que le style résout :**
- La plupart des inputs actuels n'ont pas de fond visible → ils "flottent" dans les formulaires
- Le focus n'est pas toujours visible (accessibilité)

### 2.2 Structure de champ standard

Tout champ suit cette structure :
```html
<div class="fw-field">
  <label class="fw-label">Nom de famille <span class="required">*</span></label>
  <input class="fw-input" />
  <p class="fw-hint">Aide contextuelle optionnelle</p>
  <p class="fw-error">Message d'erreur si invalide</p>
</div>
```

---

## Phase 3 — États vides & skeleton screens

### 3.1 Pattern Empty State

Chaque liste doit utiliser le même composant d'état vide :

```
┌────────────────────────────────────┐
│                                    │
│          [Icône 48px]              │
│                                    │
│    Aucun dossier pour le moment    │
│    (titre court, concret)          │
│                                    │
│    Description en 1-2 lignes       │
│    expliquant pourquoi c'est vide  │
│    et comment remédier.            │
│                                    │
│         [ + Ajouter ]              │
│         (CTA optionnel)            │
└────────────────────────────────────┘
```

**API :**
```typescript
@Input() icon!: any;
@Input() title!: string;
@Input() description?: string;
@Input() ctaLabel?: string;
@Output() ctaClick = new EventEmitter<void>();
```

---

## Phase 4 — Amélioration du portail parent

*Ces changements améliorent l'expérience du profil le plus sensible.*

### 4.1 Mobile — points de rupture

Le wizard est actuellement `grid-template-columns: 380px 1fr`. Sur mobile, la sidebar collapse mais la nav disparaît complètement (`display: none`). 

**Amélioration proposée :** Sur mobile, afficher une barre de progression compacte (steps pills) en haut à la place de la sidebar. La sidebar reste cachée.

```
Mobile < 768px :
┌──────────────────────────────┐
│  ① Famille  ② Enfants  ③ OK  │  ← barre pills compacte
├──────────────────────────────┤
│                              │
│        Formulaire            │
│                              │
│        [ Continuer → ]       │
└──────────────────────────────┘
```

### 4.2 Étape DOCS — feedback upload

L'upload de document manque de feedback visuel riche :
- État `UPLOADING` : progress bar animée sur le document
- État `UPLOADED` : checkmark vert + nom du fichier
- État `MISSING` : zone pointillée avec "Glissez votre fichier ici"
- Pas de feedback sur la taille de fichier (limite à définir et afficher)

### 4.3 Consentement final

Le checkbox de consentement est fonctionnel mais son design (checkbox custom dans un fond dark) est fragile. Migrer vers un design plus robuste et accessible :
- Utiliser un vrai `<input type="checkbox">` stylisé correctement
- S'assurer que le focus ring est visible sur fond sombre

---

## Phase 5 — School App — Cohérence des pages

### 5.1 Header de page unifié

Chaque feature page réimplémente son propre header. Créer un pattern standard :

```
┌───────────────────────────────────────────────────────┐
│  [Icon]  Titre de la page                   [Action]  │
│          Sous-titre / description                     │
└───────────────────────────────────────────────────────┘
```

Dimensions fixes : hauteur 72px, padding 0 32px.

### 5.2 Tabs — unifier les 6 implémentations

Les onglets existent dans : `admission-config`, `admission-detail`, `year-detail`, `cycle-detail`, `structure-config`, `student-detail`. Chacun a son propre CSS. Un seul composant `fw-tabs` doit les remplacer tous.

---

## Métriques de succès

Comment savoir si le design system progresse dans la bonne direction :

| Métrique | Aujourd'hui | Cible |
|---|---|---|
| Implémentations de boutons en inline Tailwind | ~20 | 0 (tout via `fw-button`) |
| Implémentations de badge de statut | 6 | 1 (`fw-badge`) |
| Valeurs de rayon non-tokenisées | 6 | 0 |
| Pages sans focus ring visible | ~8 | 0 |
| Composants shared sans test visuel | tous | 0 (Storybook à terme) |

---

## Ordre d'implémentation recommandé

```
Semaine 1  : Tokens sémantiques (_tokens.scss)           [Phase 1.1]
Semaine 2  : fw-button                                   [Phase 1.2]
Semaine 3  : fw-badge + remplacement dans admission-list [Phase 1.3]
Semaine 4  : fw-input + style unifié                     [Phase 2]
Semaine 5  : Empty state component                       [Phase 3.1]
Semaine 6  : Mobile wizard (barre de progression)        [Phase 4.1]
Semaine 7  : fw-tabs + migration des 6 implémentations   [Phase 5.2]
```

---

*Feewi Design Audit — Revue d'avril 2026*
