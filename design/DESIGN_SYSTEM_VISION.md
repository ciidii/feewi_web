# Feewi — Vision du Design System

> Le **pourquoi** est dans `DESIGN_PRINCIPLES.md`.  
> Ce document est le **quoi** — les fondations visuelles et structurelles du système.  
> Le **comment** (plan d'implémentation) est dans `DESIGN_AUDIT.md`.

---

## Structure du document

1. [Couleur](#1-couleur)
2. [Typographie](#2-typographie)
3. [Élévation](#3-élévation)
4. [Iconographie](#4-iconographie)
5. [Système spatial](#5-système-spatial)
6. [Composants](#6-composants)
7. [Patterns](#7-patterns)
8. [Documentation](#8-documentation)
9. [Nomenclature](#9-nomenclature)
10. [Processus](#10-processus)

---

## 1. Couleur

### 1.1 Rôle de la couleur

La couleur exprime la personnalité, évoque des émotions, et guide le comportement. Dans un produit comme Feewi, elle joue un rôle fonctionnel avant tout : créer la hiérarchie, signaler des états, affordancer les actions.

> **Règle d'or :** Ne jamais utiliser la couleur seule pour communiquer un état. Toujours l'accompagner d'une icône ou d'un texte (accessibilité WCAG 1.4.1).

### 1.2 Palette de marque

La palette Feewi est ancrée sur le **Midnight Slate** — sombre, sérieux, contrasté.

```
Midnight   #0f172a   ████████   Surface forte, CTA principal, sidebar
Primary    #2563eb   ████████   Action, lien, accent interactif
Ice        #f8fafc   ████████   Fond de page
White      #ffffff   ████████   Surface de carte, modal
Border     #e2e8f0   ████████   Séparateurs, contours
```

### 1.3 Système de couleur sémantique

Un système de couleur sémantique assigne une **valeur unique** à une **fonction unique**. Les tokens sont nommés par leur sens, pas par leur apparence.

```
❌ --fw-red-500        (descriptif — dit ce que c'est)
✅ --fw-status-error   (sémantique — dit ce que ça fait)
```

**Tokens de surface :**
```scss
--fw-surface-page      : #f8fafc     Fond de page
--fw-surface-card      : #ffffff     Surface de carte
--fw-surface-sunken    : #f1f5f9     Zone enfoncée (fond d'input, inner section)
--fw-surface-inverse   : #0f172a     Surface inversée (sidebar, dark CTA)
--fw-surface-overlay   : rgba(15,23,42,0.5)   Fond de modal/overlay
```

**Tokens de texte :**
```scss
--fw-text-primary      : #0f172a     Titre, contenu principal
--fw-text-secondary    : #475569     Label, métadonnée, sous-titre
--fw-text-tertiary     : #94a3b8     Placeholder, texte désactivé, aide
--fw-text-inverse      : #ffffff     Texte sur fond sombre
--fw-text-link         : #2563eb     Lien, action textuelle
```

**Tokens d'interaction :**
```scss
--fw-interactive          : #2563eb     Bouton primaire, lien, focus ring
--fw-interactive-hover    : #1d4ed8     État hover
--fw-interactive-active   : #1e40af     État press
--fw-interactive-subtle   : rgba(37,99,235,0.08)   Fond au hover léger
--fw-interactive-focus    : rgba(37,99,235,0.20)   Halo de focus
```

**Tokens de statut métier :**
```scss
/* Succès — Admis, Validé, Actif, Conforme */
--fw-status-success        : #10b981
--fw-status-success-bg     : #f0fdf4
--fw-status-success-border : #a7f3d0

/* Avertissement — Incomplet, En attente, Liste d'attente */
--fw-status-warning        : #f59e0b
--fw-status-warning-bg     : #fffbeb
--fw-status-warning-border : #fde68a

/* Erreur — Rejeté, Fermé, Suspendu, Danger */
--fw-status-error          : #ef4444
--fw-status-error-bg       : #fef2f2
--fw-status-error-border   : #fecaca

/* Information — Soumis, Vérifié, En cours */
--fw-status-info           : #3b82f6
--fw-status-info-bg        : #eff6ff
--fw-status-info-border    : #bfdbfe

/* Neutre — Brouillon, Archivé */
--fw-status-neutral        : #64748b
--fw-status-neutral-bg     : #f8fafc
--fw-status-neutral-border : #e2e8f0
```

### 1.4 Accessibilité couleur (WCAG)

Tous les textes et composants UI respectent **WCAG AA** (notre standard minimum).

| Élément | Ratio requis | Niveau |
|---|---|---|
| Texte normal (< 18px) | 4.5:1 | AA |
| Grand texte (≥ 18px ou 14px bold) | 3:1 | AA |
| Composants UI (inputs, boutons, icônes) | 3:1 | AA |
| Notre cible pour les contenus critiques | 7:1 | AAA |

**Combinaisons validées (ratios vérifiés) :**
- `#0f172a` sur `#ffffff` → 19.1:1 ✅ AAA
- `#2563eb` sur `#ffffff` → 5.9:1 ✅ AA
- `#475569` sur `#ffffff` → 6.3:1 ✅ AA
- `#94a3b8` sur `#ffffff` → 2.8:1 ⚠️ Texte seul interdit — réservé aux placeholders uniquement

**Combinaisons à éviter :**
- Texte blanc `#ffffff` sur `#2563eb` → 5.9:1 ✅ OK
- Texte blanc `#ffffff` sur `#10b981` → 2.9:1 ❌ Insuffisant — utiliser du texte sombre sur les fonds verts

> Outil recommandé : [Stark Figma Plugin](https://www.getstark.co/) pour vérifier pendant le design.

### 1.5 Règles d'usage

- **Midnight** uniquement pour les surfaces d'emphasis forte (sidebar, CTA principal)
- **Primary** pour les actions et liens — jamais pour la décoration
- **Statuts** exclusivement pour les états métier — jamais pour le style
- **Pas plus de 3 couleurs** simultanément visibles dans une vue
- Si une couleur de statut est utilisée, accompagner toujours d'une icône ou d'un texte

---

## 2. Typographie

### 2.1 Polices

```
Display / Brand   Lexend     700-800   Identité forte, wizard, landing
Interface         Inter      400-700   Tous les contenus applicatifs
Code / Monospace  JetBrains Mono  600  Références, codes accès, valeurs techniques
```

### 2.2 Échelle typographique — par fonction

Plutôt qu'une hiérarchie H1→H6, Feewi organise l'échelle par **fonction**.  
*Source : approche recommandée par Figma Design System Course.*

```
Display LG    Lexend  800  48px / 1.1  tracking: -0.03em  Titre wizard, landing
Display MD    Lexend  700  36px / 1.1  tracking: -0.02em  Titres de page majeurs
Display SM    Lexend  700  28px / 1.2  tracking: -0.02em  Titre de section importante

Heading LG    Inter   700  24px / 1.3  tracking: -0.01em  En-tête de carte principale
Heading MD    Inter   700  20px / 1.4  tracking: -0.01em  Titre de dialog/modal
Heading SM    Inter   600  18px / 1.4  tracking: 0        Titre de groupe

Title LG      Inter   600  16px / 1.5  tracking: 0        Label de section, nav item
Title MD      Inter   600  14px / 1.5  tracking: 0        Label de champ, carte compacte
Title SM      Inter   700  12px / 1.4  tracking: +0.04em  Label uppercase, caption bold

Body LG       Inter   400  16px / 1.6  tracking: 0        Contenu long (descriptions)
Body MD       Inter   400  14px / 1.6  tracking: 0        Contenu courant (défaut)
Body SM       Inter   400  13px / 1.5  tracking: 0        Contenu compact, liste dense

Caption       Inter   500  11px / 1.4  tracking: +0.02em  Aide, annotation, timestamp
Label         Inter   700  10px / 1.2  tracking: +0.08em  Label ALL CAPS, metadata
```

### 2.3 Grille de base

L'échelle est basée sur **16px comme taille de référence** (Body MD), avec un **facteur Perfect Fourth (1.333)** pour les tailles display, et des arrondis aux multiples de 4px pour les tailles d'interface.

**Alignement sur la grille 8pt :** Les tailles de police et les hauteurs de ligne s'alignent sur la grille de 8px (voir section 5).

### 2.4 Règles typographiques

- **Pas plus de 2 tailles** simultanément sur une même carte
- **Jamais de texte < 11px** à l'écran (11px = Caption minimum)
- Labels ALL CAPS (`Letter spacing: +0.08em`) uniquement pour les **métadonnées** — jamais pour les titres fonctionnels
- Le poids `800` est réservé aux **moments clés** : titres wizard, montants financiers, références critiques
- Longueur de ligne idéale : 45-75 caractères (`max-width: 65ch` sur le contenu éditorial)

---

## 3. Élévation

### 3.1 Définition

L'élévation fournit hiérarchie, séparation, et feedback visuel. Elle est exprimée via les ombres, la couleur de fond, la transparence, et les bordures. Elle **supporte les interactions** en signalant quels éléments sont cliquables.

> Note sur mobile : les états hover n'existent pas sur écran tactile. L'élévation au hover doit avoir un équivalent au tap (animation de scale ou changement de fond).

### 3.2 Modèle à 4 niveaux

```
Niveau 0  Fond de page         Aucune ombre, fond --fw-surface-page (#f8fafc)
Niveau 1  Carte posée          shadow-sm : 0 1px 2px rgba(0,0,0,0.05)
Niveau 2  Carte interactive    shadow-md : 0 4px 6px -1px rgba(0,0,0,0.07)
Niveau 3  Modal / Drawer       shadow-lg : 0 10px 15px -3px rgba(0,0,0,0.10)
Niveau 4  Tooltip / Popover    shadow-xl : 0 20px 25px -5px rgba(0,0,0,0.10)
```

### 3.3 Comportements d'élévation

| État | Transition d'élévation |
|---|---|
| Carte au repos | Niveau 1 |
| Carte au hover | Niveau 1 → 2 (transition 150ms) |
| Carte au drag | Niveau 1 → 3 (avec légère rotation) |
| Modal ouverte | Niveau 3 (fixe) |
| Toast notification | Niveau 4 (fixe) |

### 3.4 Règles

- **Jamais d'ombre noire pure** `rgba(0,0,0,X)` — utiliser des valeurs légèrement teintées vers Midnight
- **Exception autorisée :** Le CTA premium du wizard peut avoir une ombre colorée : `0 15px 30px -5px rgba(37,99,235,0.25)`
- Les éléments de **Niveau 0** n'ont aucune ombre (le fond de page ne flotte sur rien)
- L'élévation augmente avec la distance visuelle au fond — jamais l'inverse

---

## 4. Iconographie

### 4.1 Bibliothèque

Feewi utilise **Lucide Icons** (`lucide-angular`) de manière exclusive.  
Taille par défaut : `16px` pour les interfaces, `20px` pour les headers, `24px` pour les empty states.

Avantages de Lucide : cohérence de style (line icons, stroke-width 2px), large couverture, activement maintenu.

### 4.2 Tailles et conteneurs

La cohérence des icônes passe par des **dimensions fixes de conteneur** :

```
XS   Icône 12px  Conteneur 20px  Padding 4px   Badges, labels inline
SM   Icône 14px  Conteneur 24px  Padding 5px   Chips, boutons SM
MD   Icône 16px  Conteneur 32px  Padding 8px   Boutons MD, listes (défaut)
LG   Icône 20px  Conteneur 40px  Padding 10px  Headers, sections
XL   Icône 24px  Conteneur 48px  Padding 12px  Cards d'onboarding, empty states
```

### 4.3 Nomenclature et recherche

Les icônes sont référencées par leur nom Lucide (camelCase dans Angular).  
**Règle :** documenter les termes de recherche associés — l'utilisateur cherche par concept, pas par forme.

| Icône Lucide | Terme métier Feewi | Termes de recherche |
|---|---|---|
| `FileText` | Dossier / Document | dossier, fichier, document, admission |
| `Users` | Famille / Responsable | famille, parent, tuteur, responsable |
| `User` | Enfant / Élève | enfant, élève, étudiant |
| `CheckCircle` | Validé / Conforme | validé, admis, ok, conforme, succès |
| `CircleAlert` | Incomplet / Attention | attention, warning, incomplet, manquant |
| `GraduationCap` | Niveau scolaire | niveau, classe, grade |
| `CalendarClock` | Année scolaire / Override | année, période, calendrier, override |
| `Settings2` | Configuration | config, paramètres, réglages |
| `Globe` | Portail ouvert | portail, public, ouvert |
| `Lock` | Portail fermé / Sécurisé | fermé, verrouillé, privé |

### 4.4 Règles

- Une icône seule (sans texte) doit toujours avoir un `title` ou `aria-label`
- Les icônes décoratives reçoivent `aria-hidden="true"`
- Ne jamais improviser une icône "proche" — si Lucide n'a pas exactement ce qu'il faut, utiliser la plus sémantiquement proche et la documenter ici

---

## 5. Système spatial

### 5.1 La grille de base : 8pt

**Pourquoi 8pt ?** Les breakpoints principaux (768px, 1024px, 1280px) sont tous divisibles par 8. Cela crée une cohérence à toutes les échelles du système — du pixel à la page.

Toutes les valeurs d'espacement sont des **multiples de 4px**, la plupart étant des **multiples de 8px**.

```
2px    Micro         Séparation entre deux éléments très proches (icon + text inline)
4px    XS            Espacement interne d'un badge
8px    SM            Espacement interne compact
12px   SM+           Item de liste, padding compact
16px   MD            Espacement standard entre champs, padding de carte SM
20px   MD+           Espacement entre groupes, padding de bouton MD
24px   LG            Espacement entre sections d'une carte
32px   XL            Espacement entre cartes, padding de carte MD
40px   2XL           Padding de page desktop SM
48px   3XL           Padding de page desktop
64px   4XL           Espacement entre blocs majeurs (sections de page)
```

### 5.2 Grilles de layout

**Breakpoints Feewi :**
```
Mobile       < 768px    1 colonne, margin 16px
Tablet       768-1024px 1-2 colonnes, margin 24px
Desktop SM   1024-1280px 2-3 colonnes, margin 32px
Desktop LG   > 1280px   12 colonnes, margin 48px
```

**Grille colonne desktop (12 colonnes) :**
- Colonnes : 12
- Gouttière (gutter) : 24px
- Marge : 48px
- Largeur de colonne : dynamique

**Layouts applicatifs :**

```
Portail Parent (enrollment)
  380px sidebar | 1fr zone saisie | max-width contenu: 800px

School App (post-login)
  72px nav | 1fr contenu | padding: 32px
  
SaaS Admin
  72px nav | 1fr contenu | padding: 32px (densité légèrement + élevée acceptée)
  
Dialog / Modal
  Petite: 400-480px | Moyenne: 560px | Grande: 720px | XL: 860px
```

### 5.3 Grille baseline

La grille baseline (lignes horizontales espacées de 8px) assure le **rythme vertical**.

**Règles :**
- La hauteur des éléments (boutons, inputs, cartes) est toujours un multiple de 8px : 32, 40, 44, 48, 56px
- Les espacements verticaux entre sections sont multiples de 8px
- Les `line-height` des textes s'alignent sur la grille : 16, 20, 24, 28, 32px

### 5.4 Espacement sémantique

Au-delà des valeurs brutes, l'espacement communique des **relations** :

```
Espacement très réduit  (2-4px)  : Éléments du même groupe atomique (icon + label)
Espacement réduit       (8-12px) : Éléments liés dans une liste
Espacement moyen        (16-24px): Séparation entre champs / groupes
Espacement large        (32-48px): Séparation entre sections distinctes
Espacement très large   (64px+)  : Séparation entre blocs de page majeurs
```

> "La relation entre les éléments est aussi importante que les éléments eux-mêmes."

---

## 6. Composants

### 6.1 Inventaire — état actuel

| Composant | Chemin | Statut |
|---|---|---|
| `form-shell` | `shared/form-shell` | ✅ Stable |
| `confirm-dialog` | `shared/confirm-dialog` | ✅ Stable |
| `data-list` | `shared/data-list` | ⚠️ Couplé au domaine |
| `loader` | `shared/loader` | ✅ Simple |
| Bouton | Inline Tailwind (partout) | ❌ À créer : `fw-button` |
| Badge de statut | Inline Tailwind (6 lieux) | ❌ À créer : `fw-badge` |
| Champ de formulaire | Pas de composant | ❌ À créer : `fw-input` |
| Onglets | Inline (6 implémentations) | ❌ À créer : `fw-tabs` |
| État vide | Inline (chaque liste) | ❌ À créer : `fw-empty-state` |

### 6.2 Anatomie d'un composant Feewi

Chaque composant partagé respecte cette structure :

```
Nom           fw-[nom]
Sélecteur     app-fw-[nom]
Chemin        src/app/shared/components/[nom]/
Fichiers      [nom].component.ts  |  [nom].component.html  |  [nom].component.scss
```

**Règles de composant :**
1. Standalone (`standalone: true`)
2. Aucune logique métier — aucune référence à un domaine (`admission`, `student`, etc.)
3. Toutes les couleurs via les tokens CSS (`var(--fw-*)`) — jamais de valeurs hardcodées
4. 5 états interactifs définis : default, hover, focus, active, disabled
5. Accessible : `role`, `aria-label`, `aria-disabled` si nécessaire
6. Documenté dans ce fichier avant d'être codé

### 6.3 Composants prioritaires — specs

#### `fw-button`

```typescript
@Input() variant:  'primary' | 'secondary' | 'ghost' | 'danger' = 'primary';
@Input() size:     'sm' | 'md' | 'lg' = 'md';
@Input() loading:  boolean = false;
@Input() disabled: boolean = false;
@Input() icon?:    LucideIconName;
@Input() iconPosition: 'left' | 'right' = 'left';
```

Dimensions :
```
SM   h-8   px-3   text-xs   gap-1.5    icon 14px
MD   h-10  px-4   text-sm   gap-2      icon 16px  (défaut)
LG   h-12  px-6   text-base gap-2.5   icon 18px
```

Variantes :
```
primary    bg: --fw-surface-inverse  text: --fw-text-inverse  hover: bg #1e293b
secondary  bg: --fw-surface-sunken  text: --fw-text-secondary hover: bg #e2e8f0
ghost      bg: transparent          text: --fw-text-secondary hover: bg --fw-interactive-subtle
danger     bg: --fw-status-error    text: white               hover: bg #b91c1c
```

#### `fw-badge`

```typescript
@Input() status!: string;   // Valeur métier : 'DRAFT', 'ADMITTED', 'ACTIVE'...
@Input() size:   'xs' | 'sm' = 'sm';
@Input() dot:    boolean = false;  // Affiche un point coloré sans texte
```

Mapping complet :
```typescript
const STATUS_MAP: Record<string, { label: string; token: string }> = {
  DRAFT:      { label: 'Brouillon',      token: 'neutral' },
  SUBMITTED:  { label: 'Soumis',         token: 'info'    },
  VERIFIED:   { label: 'Vérifié',        token: 'info'    },
  TESTING:    { label: 'En évaluation',  token: 'warning' },
  ADMITTED:   { label: 'Admis',          token: 'success' },
  VALIDATED:  { label: 'Validé',         token: 'success' },
  WAITLIST:   { label: 'Liste d\'attente',token:'warning' },
  REJECTED:   { label: 'Rejeté',         token: 'error'   },
  CANCELLED:  { label: 'Annulé',         token: 'neutral' },
  ACTIVE:     { label: 'Actif',          token: 'success' },
  SUSPENDED:  { label: 'Suspendu',       token: 'error'   },
  PLANNING:   { label: 'Planification',  token: 'info'    },
  CLOSED:     { label: 'Clôturée',       token: 'neutral' },
};
```

---

## 7. Patterns

Les patterns sont des **solutions réutilisables à des problèmes récurrents**. Contrairement aux composants (éléments UI), les patterns sont des arrangements de composants qui résolvent des objectifs utilisateur fréquents.

### 7.1 Patterns identifiés dans Feewi

| Pattern | Description | Domaine |
|---|---|---|
| **Wizard multi-étapes** | Progression guidée avec sidebar + zone de saisie | Enrollment |
| **Liste filtrée + détail** | Table avec filtres + vue détail latérale ou en page | School App |
| **Confirmation destructive** | Dialog avant action irréversible | Global |
| **Override de configuration** | Éditeur isolé pour surcharger une config globale | Admission Config |
| **Upload de document** | Zone de drop + statut + preview | Enrollment + Admin |
| **KPI card** | Métrique chiffrée avec label et tendance optionnelle | Dashboard |
| **Empty state** | État vide avec illustration + CTA | Global |
| **Toast feedback** | Notification éphémère post-action | Global |

### 7.2 Pattern : Confirmation destructive

**Quand l'utiliser :** Avant toute action irréversible (suppression, rejet, annulation, suspension).

**Structure imposée :**
1. Icône de type (danger/warning) — jamais d'icône verte pour une action destructive
2. Titre court sous forme de question : "Supprimer l'override ?"
3. Conséquence expliquée en une phrase : "Cette action est irréversible. L'année reviendra au comportement ouvert par défaut."
4. Deux boutons : "Annuler" (secondaire, à gauche) | "Supprimer" (danger, à droite)

**Toujours utiliser `confirm-dialog`** — jamais `window.confirm()`.

### 7.3 Pattern : Override de configuration

Utilisé dans `admission-config` pour les overrides année/cycle/niveau.

**Règles :**
- L'éditeur d'override est **isolé** du formulaire global (état local séparé)
- Toujours afficher un bandeau indiquant la portée courante ("Override — Année 2026-2027")
- Bouton "Supprimer l'override" accessible uniquement si un override existe
- Sauvegarde immédiate (pas de "Publier" globale)

---

## 8. Documentation

### 8.1 Formats de documentation Feewi

| Format | Outil | Usage |
|---|---|---|
| Fichiers Markdown | `/design/*.md` | Vision, principes, audit — lecture humaine |
| Commentaires inline | TypeScript/SCSS | Décisions non-obvieuses uniquement |
| CLAUDE.md | Racine projet | Instructions pour l'agent AI |
| Storybook | (à venir) | Documentation visuelle des composants |

### 8.2 Ce qui doit être documenté

Documenter **uniquement les décisions non-évidentes** :
- Pourquoi un token a cette valeur et pas une autre
- Pourquoi un composant ne couvre pas un cas particulier
- Pourquoi on a dévié d'un principe (avec justification)

Ne pas documenter ce que le code exprime déjà clairement.

### 8.3 Règle de mise à jour

**La documentation est un critère de "Definition of Done".**  
Un composant ou un token n'est pas livré tant que :
- Il est décrit dans la section 6 de ce fichier
- Il est référencé dans `DESIGN_AUDIT.md` (backlog → fait)
- Son usage est illustré (exemple de template Angular)

### 8.4 Test de documentation

Avant de valider une documentation, la tester avec un développeur qui n'a pas participé à la décision :
- Peut-il trouver l'information qu'il cherche en < 2 minutes ?
- Peut-il utiliser le composant correctement sans demander d'aide ?
- Y a-t-il du jargon qu'il ne comprend pas ?

---

## 9. Nomenclature

### 9.1 Principe — nommage sémantique

Les noms communiquent le **sens et la fonction**, pas l'apparence ou la valeur.

```
❌ --fw-red           (descriptif — dit la couleur)
❌ --fw-color-500     (abstrait — ne dit rien)
✅ --fw-status-error  (sémantique — dit la fonction)
```

### 9.2 Structure de token

```
--fw-[catégorie]-[sous-catégorie?]-[état?]

Exemples :
--fw-surface-card           Surface > carte
--fw-text-secondary         Texte > secondaire
--fw-status-success         Statut > succès
--fw-status-success-bg      Statut > succès > fond
--fw-interactive-hover      Interactif > hover
```

### 9.3 Structure de composant

Inspiré du modèle Category / Use / Variation du Figma Design System Course.

```
Catégorie  :  fw-button, fw-badge, fw-input, fw-tabs
Usage      :  fw-button--primary, fw-button--ghost
Variation  :  fw-button--primary--sm, fw-button--primary--lg
```

En Angular : le `variant` et `size` sont des `@Input()` — pas des classes CSS manuelles.

```html
<!-- ✅ Correct -->
<app-fw-button variant="primary" size="lg">Soumettre</app-fw-button>

<!-- ❌ Incorrect -->
<button class="fw-button fw-button--primary fw-button--lg">Soumettre</button>
```

### 9.4 Casse et alignement dev

En accord avec l'équipe de développement Angular/TypeScript :

| Contexte | Convention | Exemple |
|---|---|---|
| Tokens CSS | kebab-case | `--fw-status-error` |
| Variables SCSS | kebab-case | `$fw-primary` |
| Classes Tailwind | kebab-case | `text-primary-600` |
| Inputs Angular | camelCase | `variant`, `iconPosition` |
| Enums TypeScript | SCREAMING_SNAKE_CASE | `'NEW_ENROLLMENT'` |
| Composants Angular | PascalCase | `FwButtonComponent` |

---

## 10. Processus

### 10.1 Collaboration design × développement

Le design system fonctionne quand designers et développeurs collaborent **tôt** :

```
Mauvais flux :
  Design fini → Dev review → "Ça ne peut pas se faire" → Refonte

Bon flux :
  Esquisse → Dev consulté → Itération → Design final → Code
```

**Stratégies concrètes :**
1. Inclure un développeur dans les critiques de design **avant** la finalisation
2. Consulter le dev **lors de la création d'un composant** pour aligner les APIs (`@Input`)
3. Identifier les contraintes techniques tôt (CSS, Angular, performance)
4. Comprendre les limitations d'assets (taille de fichier, formats supportés)

### 10.2 Processus d'évolution du système

```
1. IDENTIFIER   Un besoin non couvert est détecté (nouveau composant, token manquant)
       ↓
2. DOCUMENTER   Ajouter au backlog dans DESIGN_AUDIT.md (section 11)
       ↓
3. ÉVALUER      Un usage ? → inline acceptable
                Deux usages + ? → créer le composant
       ↓
4. CONCEVOIR    Spécifier dans DESIGN_SYSTEM_VISION.md (section 6 ou 7)
       ↓
5. VALIDER      Revue avec au moins 1 autre personne
       ↓
6. IMPLÉMENTER  Code + tests visuels
       ↓
7. CLORE        Supprimer du backlog, marquer comme "stable" dans l'inventaire
```

### 10.3 Gestion des changements cassants

Tout changement d'un token ou composant existant **doit** :
1. Être annoncé avant implémentation
2. Lister toutes les occurrences impactées (`grep` sur la codebase)
3. Proposer une migration claire (ancien → nouveau)
4. Ne pas supprimer l'ancien avant que la migration soit terminée

### 10.4 Onboarding d'un nouveau contributeur

Ordre de lecture recommandé :
1. `USER_PROFILES.md` — Comprendre pour qui on conçoit
2. `DESIGN_PRINCIPLES.md` — Comprendre pourquoi on décide comme on décide
3. `DESIGN_SYSTEM_VISION.md` (ce fichier) — Comprendre les fondations
4. `DESIGN_AUDIT.md` — Comprendre l'état actuel et ce qui reste à faire

---

*Feewi Design System — Fondations — Avril 2026*
