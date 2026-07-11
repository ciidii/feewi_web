# Feewi — Stratégie UI/UX Unifiée : Diagnostic Approfondi & Plan d'Action

> **Statut au 2026-07-11 : entièrement implémenté.** Toutes les actions du plan §6 (P0 à P2) ont été
> réalisées et validées par build (`npx ng build --configuration development`). Ce document reste la
> référence diagnostique ; les sections 5.1 (architecture onglets) et 3.3 (liste des pages
> `.fw-standard-card`) ont été corrigées ci-dessous pour refléter la décision finale, qui diffère de
> la recommandation initiale sur un point important (voir §5.1). Le §8 récapitule l'écart entre le
> diagnostic et le résultat livré, y compris des bugs supplémentaires trouvés en cours de route et
> une limitation explicitement laissée hors scope.

> Ce document est un audit de terrain (lecture exhaustive du code, pas de maquettes) mené en réponse
> à un constat de terrain : *"on tâtonne, on mélange filtre et onglets sur certaines pages, les
> headers de tableau et le corps du tableau sont séparés."*
>
> Il **complète** `DESIGN_AUDIT.md` (avril 2026), dont plusieurs recommandations sont déjà livrées
> (`fw-button`, `fw-badge`, `fw-tabs`, `fw-empty-state` existent et sont utilisés). Ce document
> reprend un chantier que `DESIGN_AUDIT.md` §5.2 avait déjà identifié sans le résoudre ("6
> implémentations d'onglets à unifier") et va nettement plus loin : **plusieurs des incohérences
> trouvées ne sont pas esthétiques, ce sont des bugs fonctionnels** — des filtres qui n'existent que
> visuellement, des onglets qui ne s'affichent jamais, des champs de formulaire sans style.
>
> Portée : 19 pages "liste", 10 pages "détail", 17 formulaires, et le composant `data-list`
> (4 vues) inspectés fichier par fichier.

---

## 1. Résumé exécutif

Le diagnostic initial de l'utilisateur ("on mélange filtre et onglets", "header et corps de tableau
séparés") est confirmé — mais la cause est plus profonde qu'un problème de goût visuel :

1. **Deux systèmes d'onglets concurrents et incompatibles coexistent** : celui du `page-shell`
   (`app-fw-tabs`) et un second, interne à `app-data-list`, avec deux modèles de données différents
   (`FwTab` par `id` vs `TabItem` par `label`). Le second est **structurellement cassé** : il ne
   s'affiche jamais quand `cardMode=false` — ce qui touche directement **la liste des dossiers
   d'admission**, très probablement l'écran le plus utilisé de toute l'application.
2. **Un contraste de couleur non voulu** entre l'en-tête et le corps de `table-view` crée
   exactement l'effet "deux boîtes empilées" décrit — cause unique, localisée, un correctif simple.
3. **Quatre implémentations parallèles** existent pour chacun de : la carte d'information
   (`.dossier-card` / `.detail-card` / `.info-card` / `.fw-standard-card`), le champ de formulaire,
   et le toggle switch — alors que le design system documenté (`DESIGN_SYSTEM_VISION.md` §6.2)
   prescrit explicitement l'inverse ("un composant partagé, jamais de classes CSS locales").
4. **Trois formulaires appliquent une classe CSS (`fw-input`) qui ne produit aucun style** car la
   règle SCSS n'existe que nichée sous `.fw-input-wrapper` — un bug visuel silencieux, pas une
   simple incohérence.

Bonne nouvelle, comme le disait déjà `DESIGN_AUDIT.md` : **aucune refonte n'est nécessaire**. Le bon
pattern existe déjà et fonctionne sur plusieurs pages (`user-account-list`, `staff-directory`,
`class-detail`) — il s'agit de le généraliser et de retirer le mécanisme concurrent qui casse tout.

---

## 2. Ce qui fonctionne déjà — à répliquer, pas à réinventer

Avant la liste des problèmes : ces pages sont la preuve que le système actuel, bien utilisé, marche.

| Page | Ce qu'elle fait bien |
|---|---|
| `user-account-list` | Onglets de statut au niveau `page-shell`, `list-command-bar` pour la recherche seule, `data-list` sans tabs internes ni recherche dupliquée — séparation nette et **fonctionnelle**. |
| `staff-directory` | Même architecture, onglets de catégorie réellement filtrants (`.ts:96-101`). |
| `class-detail`, `cycle-detail` | Onglets = navigation entre sous-domaines (Élèves / Équipe / Emploi du temps), jamais un filtre — usage sans ambiguïté. |
| `structure-config` | Pas d'onglets du tout, `list-command-bar` seule — cas le plus simple, aucune confusion possible. |
| `enrollment-config` | Onglets de premier niveau ET sous-onglets, tous deux utilisés comme navigation de contenu, jamais comme filtre — bon contre-exemple pédagogique. |

La règle qui se dégage de ces pages saines, avant même de la formuler en section 5 : **les onglets
vivent uniquement au niveau `page-shell`, jamais à l'intérieur de `data-list`.**

---

## 3. Constats détaillés

### 3.1 Architecture Onglets/Filtres — CRITIQUE (fonctionnel)

Quatre mécanismes indépendants coexistent dans l'app pour "trier/filtrer une liste" :

| # | Mécanisme | Où | Modèle de données |
|---|---|---|---|
| 1 | `app-fw-tabs` (autonome ou via `page-shell [tabs]`) | Partout | `FwTab`, identité par `id` |
| 2 | Onglets internes à `app-data-list` | `data-list.component.html:57-73` | `TabItem`, identité par `label` |
| 3 | `app-fw-list-command-bar` (recherche + chips + slots) | La plupart des listes | — |
| 4 | `shared-filter-modal` (filtres avancés) | `student-list`, `enrollment-list` | — |

**Le mécanisme #2 est cassé par construction** : `data-list.component.html:6` masque toute sa barre
d'outils interne (recherche, filtre, **et les onglets**) derrière la condition
`cardMode() && !hideToolbar()`. Or plusieurs pages passent `[cardMode]="false"` tout en fournissant
des `[tabs]` fonctionnels à `data-list` — ces onglets ne sont alors **jamais rendus dans le DOM** :

| Page | Onglets prévus | Logique de filtrage | Rendu à l'écran |
|---|---|---|---|
| **`enrollment-list`** (dossiers d'admission) | Tous / À Vérifier / À Évaluer / En Décision | Fonctionnelle (`.ts:291-298, 339-346`) | **Invisible** |
| `year-list` | Tous / Active / En préparation | Fonctionnelle (`.ts:94-98, 109-119`) | **Invisible** |
| `audit-trail` | Tous / Sécurité / Scolarité / Finance | Non implémentée (commentaire explicite `.ts:121-124`) | Invisible et inerte de toute façon |
| `student-list` | Statut élève | Redondant — le vrai mécanisme est au niveau `page-shell` | Invisible mais sans impact (code mort) |

`enrollment-list` est le cas le plus grave : c'est la liste des dossiers d'inscription, un écran
quotidien pour le secrétariat (cf. `USER_PROFILES.md`, Profil 2), et **il n'existe aujourd'hui aucun
moyen visible de trier les dossiers par étape du pipeline**, alors que le code pour le faire existe
et fonctionne côté logique.

**Autres bugs trouvés dans cette même famille :**

- **Onglets purement cosmétiques** (ne filtrent rien du tout) : `tenant-manager.component.ts:97-101`
  (commentaire explicite "on garde le filtrage simple"), `global-audit.component.html:32-40` (aucun
  binding `[activeTab]`/`(onTabChange)`).
- **Slot de projection inexistant** : `cycle-detail.component.html:54` projette un switch de vue
  Tuiles/Tableau dans `[extra-filters]`, mais `FwListCommandBarComponent` ne définit que
  `[bulk-actions]`, `[primary-actions]`, `[quick-filters]` — Angular rejette silencieusement le
  contenu, le bouton n'apparaît jamais.
- **Doublon visible sur une seule page** : `global-audit.component.html:16-29` a sa propre barre de
  recherche + bouton filtre (non câblés), **en plus** de la barre interne de `data-list` (rendue par
  défaut) — deux champs de recherche et deux boutons filtre à l'écran, aucun fonctionnel.
- **Filtre actif visuellement, sans effet réel** : le pill "Incomplets" d'`enrollment-list`
  (`.html:52-55`) génère un chip "État : Dossiers Incomplets" mais cette valeur n'est jamais
  transmise à l'appel API (`.ts:349-359`).
- **Collision terminologique** : sur `enrollment-list`, le mot **"État"** désigne à la fois le statut
  du pipeline (onglets) et la complétude documentaire (pill) — deux axes différents, un seul mot.
  C'est précisément le type de confusion "onglet vs filtre" pressenti au départ.
- **Fonctionnalité fantôme** : `staff-directory.component.ts:8,58` importe l'icône `Filter` et
  prépare `activeFilterChips`, mais aucun bouton de filtre avancé n'est jamais rendu — trace d'un
  chantier abandonné en cours de route.
- **Taxonomies incohérentes entre pages jumelles** : `global-audit` (Tous/Sécurité/Provisioning) vs
  `audit-trail` (Tous/Sécurité/Scolarité/Finance) — deux pages d'audit très proches, deux découpages
  différents, toutes deux non fonctionnelles.

### 3.2 Table header/body désuni — MAJEUR (cause confirmée, correctif simple)

Diagnostic exact : `table-view.html:4` applique `bg-slate-50/30` au `<thead>` — soit
`rgba(248,250,252,0.3)`, une teinte quasi identique à `--fw-surface-page` (`#f8fafc`, le fond de
**toute la page**, défini jusque dans `index.html:24`). Le `<tbody>` force à l'inverse
`background: white` (`table-view.scss:40-41`), la couleur de la carte englobante.

Résultat : le header du tableau "ressemble" au fond de la page (comme s'il flottait en dehors de la
carte), tandis que le corps ressemble à une carte blanche distincte posée en dessous — sans bordure
ni ombre pour adoucir la transition (`table-view.scss:31-38` : commentaire du code lui-même dit
*"ZERO BORDERS"*). C'est un vrai `<table>` HTML sémantique (pas deux blocs DOM séparés) et
l'alignement des colonnes est correct — le seul défaut est ce contraste de fond.

**Portée** : `table-view` est la vue par défaut effective de `data-list`
(`data-list.component.ts:78-90`), utilisée par **16 pages**. Deux pages seulement ont un `<table>`
maison indépendant, et l'une d'elles (`enrollment-detail`, tableau de notes) n'a pas ce défaut.

### 3.3 Fragmentation des cartes d'information — MAJEUR (dette d'architecture)

Quatre noms de classes CSS différents implémentent le même concept ("carte avec en-tête icône+titre
+ corps"), chacun redéclaré localement dans son propre `.scss` — aucun n'est un composant Angular :

| Variante | Pages | Défaut notable |
|---|---|---|
| `.dossier-card` | staff-detail, my-profile | Dupliquée à l'identique dans 2 fichiers `.scss` |
| `.detail-card` | user-detail | `border-radius: 24px` en dur (au lieu d'un token) |
| `.info-card` | tenant-detail | **Couleurs 100% hex brutes**, aucun token `--fw-*` |
| `.fw-standard-card` | student-detail, enrollment-detail, cycle-detail, curriculum-detail, year-detail (5 pages — `class-detail` corrigé : cette page utilise en réalité `.sidebar-card`, une classe indépendante, pas `.fw-standard-card`) | Le préfixe `fw-` laisse croire à un composant partagé — il n'existe pas |

S'y ajoutent 3 noms différents pour les paires libellé/valeur (`.info-label`/`.info-value`,
`.label`/`.value`, `label`/`.field-value`) et des largeurs de sidebar "détail + panneau latéral"
incohérentes (`1fr 360px`, `1fr 380px`, `1fr 320px` selon la page).

### 3.4 Champs de formulaire — CRITIQUE (bug visuel silencieux)

Quatre systèmes coexistent pour un même besoin :

1. **`.fw-field` / `.fw-label` / `.fw-input-wrapper > .fw-input` / `.fw-hint`** — le système
   global correctement défini (`styles.scss:434-543`), utilisé par 10 formulaires. C'est la
   référence à généraliser.
2. **`class="fw-input"` posée sans `.fw-input-wrapper` englobant** — `document-type-form.html:24`,
   `custom-field-form.html:36,43,109,144-152`, `tenant-edit-form.html:19,29,38,47,56,63`. Or la règle
   SCSS `.fw-input` n'existe **que** nichée sous `.fw-input-wrapper .fw-input {...}`
   (`styles.scss:456-472`) — **ces champs n'ont donc aucun style et retombent sur l'apparence par
   défaut du navigateur**, silencieusement, malgré une classe qui semble correcte au premier coup
   d'œil.
3. **`.fw-input-clean`** — classe locale propre à `tenant-form` (13 usages), alors que son voisin
   direct `tenant-edit-form` (même domaine, même objet "tenant") utilise le système #2 cassé.
4. **Tailwind inline sans classe `fw-*`** — `student-edit-form.html:22,44,58,79,88`, avec en plus
   `blue-500` en dur au lieu du token `--fw-primary`.

### 3.5 Toggle switch — MINEUR (cohérence)

Quatre implémentations pour un simple booléen on/off : `.fw-toggle-switch` (le système référence,
`styles.scss:208`), `.toggle-switch` (`service-form`, quasi-identique mais nom différent),
`<mat-slide-toggle>` (`subject-form`), et un toggle Tailwind "peer-checked" fait main
(`custom-field-form`, `document-type-form`).

### 3.6 Header de page

Déjà traité dans cette session (suppression du header global, relocalisation recherche/notifications/
profil, élévation du header de page) — mentionné ici pour mémoire, aucune action supplémentaire
requise à ce stade.

---

## 4. Cause racine commune

`DESIGN_PRINCIPLES.md` (Principe 4, "Cohérence systémique") énonce déjà la règle : *"si un pattern
est utilisé deux fois, le composant est créé."* Le diagnostic montre que cette règle est **écrite
mais jamais appliquée mécaniquement** — rien dans le projet ne détecte qu'une nouvelle page a
recopié un `.scss` existant au lieu de consommer un composant. Le préfixe `fw-` est devenu un signal
de confiance trompeur : `.fw-standard-card` et `.fw-input-clean` le portent sans être des composants
partagés, ce qui a permis à la dérive de progresser sans déclencher d'alarme visuelle en revue de
code.

Le mécanisme de tabs interne à `data-list` illustre le même phénomène à l'échelle d'un composant :
deux systèmes ont été développés en parallèle (probablement à des moments différents) sans jamais
être unifiés ni l'un des deux retiré — `DESIGN_AUDIT.md` l'avait identifié en avril, personne n'a
suivi.

---

## 5. Stratégie unifiée — ce que toutes les pages doivent respecter

### 5.1 Architecture de page "Liste" (décision finale — corrigée après retour utilisateur)

> **Écart avec la recommandation initiale.** Le plan ci-dessous proposait à l'origine que les
> onglets vivent *exclusivement* au niveau `page-shell`. En pratique, testé sur `enrollment-list` via
> une maquette HTML statique, ce choix s'est révélé faux pour les onglets qui sont en réalité des
> **filtres au niveau table** ("À Vérifier", "À Évaluer"...) : l'utilisateur a explicitement demandé
> qu'ils vivent dans l'en-tête du tableau/de la liste, pas au niveau page, avec aucune séparation
> visuelle entre cet en-tête et le corps du tableau. La règle retenue est donc plus fine que
> "toujours `page-shell`" :

```
app-fw-page-shell
  [tabs]        ← UNIQUEMENT pour une navigation de PAGE/sous-domaine (ex: Vue d'ensemble / Permissions),
                  jamais pour un filtre de statut sur les lignes d'une liste
  [actions]     ← CTA principal de la page

  app-fw-list-command-bar          (si la page a une barre de commande)
    recherche texte
    [tabs]/[activeTab]/(tabChange) ← filtres de statut sur les lignes (ex: pipeline d'admission)
    chips de filtres avancés       ← axes ORTHOGONAUX aux tabs (jamais le même mot/axe)

  app-data-list → table-view
    [tabs]/[activeTab]/(onTabChange) ← alternative pour les pages SANS list-command-bar :
                                        rendu directement au-dessus du <thead>, dans la même carte
```

**Ce qui a été fait concrètement** : le mécanisme de tabs interne à `DataListComponent` (modèle
`TabItem`, masqué par `cardMode`) a été retiré des pages où il faisait doublon avec un mécanisme déjà
fonctionnel (`student-list`, dont les tabs vivent au niveau `page-shell`). Pour `enrollment-list` en
revanche, le support `[tabs]`/`[activeTab]`/`(tabChange)` a été ajouté directement à
`list-command-bar` (rendu sur la même ligne que le bouton "Avancé"), et un support équivalent a été
ajouté à `table-view` pour les pages sans command-bar — les deux rendent la liste de tabs directement
au-dessus du `<thead>`, dans la même carte que le tableau, sans espace ni changement de fond entre les
deux (ce qui a aussi réglé le bug §3.2 pour ces pages). `year-list` et `audit-trail` restent
documentés comme cas à traiter au cas par cas avec le même principe si besoin.

**Limitation connue, volontairement non traitée** : les onglets de `tenant-manager`, `global-audit`
et `audit-trail` restent **cosmétiques** (ils ne filtrent pas réellement les lignes). Leurs listes
sont paginées côté serveur ; un filtrage honnête demande un paramètre de requête backend qui n'a pas
pu être confirmé ni ajouté depuis ce repo frontend seul. Documenté ici plutôt que masqué par un
filtrage côté client qui ne filtrerait que la page courante (trompeur).

**Règle de décision "onglet ou filtre ?"** — inchangée :
- **Onglet** → un seul axe, valeurs mutuellement exclusives, petit nombre fixe (statut, rôle,
  sous-domaine).
- **Filtre** → tout le reste : multi-sélection, plages de dates, axes combinables entre eux.
- Ne jamais réutiliser le même terme (ex: "État") pour deux mécanismes différents sur une même page.

### 5.2 Un seul composant de carte d'information : `fw-info-card` — livré

Composant Angular partagé créé à `shared/components/info-card/` (sélecteur `app-fw-info-card`),
remplaçant les 4 variantes sur les 9 pages détail concernées. API finale (légèrement étendue par
rapport au plan initial, pour couvrir des cas réels rencontrés en migrant) :

```typescript
@Input() icon?: any;
@Input() title?: string;                  // optionnel : voir [header-left] ci-dessous
@Input() subtitle?: string;
@Input() accent: 'default' | 'primary' = 'default';
@Input() noPadding: boolean = false;      // corps sans padding (ex. feed d'activité, liste de docs)
@Input() noHeader: boolean = false;       // carte "coquille" sans en-tête (ex. tuile de stat)
// corps via <ng-content>, actions via <ng-content select="[card-actions]"> dans le header,
// en-tête entièrement personnalisé via <ng-content select="[header-left]"> (remplace icon+title,
// utilisé par cycle-detail pour son badge de rang numérique à la place d'une icône)
```

`.info-label`/`.info-value` sont documentées comme les seuls noms de classe globaux (définis dans
`styles.scss`) pour les paires libellé/valeur à l'intérieur du corps.

### 5.3 Champs de formulaire — livré

`.fw-input` et `.fw-hint` existent désormais en règles de premier niveau dans `styles.scss` (en plus
de leur variante imbriquée `.fw-input-wrapper .fw-input`), ce qui répare silencieusement tous les
formulaires qui posaient `class="fw-input"` sans wrapper englobant. La migration de `tenant-form`
(`.fw-input-clean`) et `student-edit-form` (Tailwind inline) vers `.fw-field`/`.fw-input` reste hors
scope de ce chantier (non listée en P0/P1/P2 du plan §6) et n'a pas été traitée.

### 5.4 Un seul toggle : `.fw-toggle-switch` — livré

`service-form` (`.toggle-switch` local), `subject-form` (`<mat-slide-toggle>`), `custom-field-form`
et `document-type-form` (case à cocher cachée + Tailwind `peer-checked`) migrent tous vers le pattern
`<button class="fw-toggle-switch sm" [class.on]="…" (click)="…">`. Pour `subject-form` et
`custom-field-form`/`document-type-form`, la migration a changé le **mécanisme de liaison** (de
`formControlName` sur un contrôle natif vers `.get()/.setValue()` + `(click)` manuel), le
`FormControl` sous-jacent restant inchangé. Effet de bord positif : `subject-form` utilisait
`<mat-slide-toggle>` sans jamais importer `MatSlideToggleModule` (bug latent silencieux, résolu par
la suppression du composant Material).

### 5.5 Table header/body

Dans `table-view.scss` : retirer `bg-slate-50/30` du `<thead>` pour qu'il partage le même blanc que
le `<tbody>` (les deux vivent déjà dans la même carte avec sa propre ombre — aucune séparation
interne supplémentaire n'est nécessaire). Si une démarcation reste souhaitée visuellement, un simple
`border-bottom: 1px solid var(--fw-border-subtle)` sous le `<thead>` suffit, sans changer sa couleur
de fond.

---

## 6. Plan d'action priorisé

| Priorité | Action | Impact | Statut |
|---|---|---|---|
| **P0 — casse une fonctionnalité réelle** | Rendre visibles les onglets d'`enrollment-list` (le plus utilisé), `year-list`, `student-list` | Rétablit un tri par statut aujourd'hui invisible sur l'écran le plus fréquenté du produit | ✅ Fait — `enrollment-list` via `list-command-bar`, `student-list` doublon retiré. `year-list`/`audit-trail` corrigés indirectement par le fix `ViewPreferenceService` (§8). |
| **P0** | Réparer `.fw-input` pour qu'elle fonctionne sans wrapper | 3 formulaires retrouvent leur style instantanément | ✅ Fait, plus `.fw-hint` (même bug, trouvé en cours de route) |
| **P0** | Faire transmettre `incompleteOnly` à l'appel API dans `enrollment-list` | Le filtre "Incomplets" devient réellement fonctionnel | ✅ Fait |
| **P1 — cohérence visuelle immédiate** | Corriger le contraste `thead`/`tbody` de `table-view` | Corrige la plainte initiale sur ~16 pages d'un coup | ✅ Fait (traité tôt dans la session, avant la rédaction de ce document) |
| **P1** | Ajouter le slot `[extra-filters]` manquant à `list-command-bar` (ou déplacer le switch de vue) | Débloque le switch Tuiles/Tableau de `cycle-detail` | ✅ Fait — renommé en `[quick-filters]`, slot déjà existant |
| **P1** | Retirer la barre de recherche/filtre morte de `global-audit` | Supprime le doublon visible le plus flagrant | ✅ Fait |
| **P2 — dette d'architecture** | Retirer le mécanisme de tabs interne à `data-list`, migrer les 4 pages concernées | Élimine la cause racine de la moitié des bugs P0/P1 | ✅ Fait pour `student-list` (doublon retiré) ; `enrollment-list` migré vers `list-command-bar` (voir §5.1 pour l'écart avec le plan initial) |
| **P2** | Créer `fw-info-card`, migrer les 10 pages détail | Unifie durablement les pages détail | ✅ Fait — 9 pages réelles (le chiffre "10" du plan initial comptait `class-detail` par erreur, voir §3.3) : staff-detail, my-profile, user-detail, tenant-detail, student-detail, enrollment-detail, curriculum-detail, cycle-detail, year-detail |
| **P2** | Unifier le toggle switch sur `.fw-toggle-switch` | 4 formulaires à migrer | ✅ Fait — service-form, subject-form, custom-field-form, document-type-form |
| **P3 — gouvernance** | Mettre à jour `DESIGN_AUDIT.md` pour refléter ce qui est fait (le header global n'existe plus, `fw-button`/`fw-tabs`/`fw-badge` sont livrés) | Garde les documents de design vivants et fiables | ✅ Fait |

---

## 7. Prochaines étapes

~~Ce document est volontairement diagnostic uniquement — aucune modification de code n'a été
effectuée.~~ **Mise à jour du 2026-07-11 : toutes les actions ci-dessus ont été implémentées et
validées par build.** Voir §8 pour le détail de ce qui a été trouvé/décidé en cours d'exécution et ne
figurait pas dans le diagnostic initial.

---

## 8. Écarts entre le diagnostic et l'implémentation

Trois agents de vérification ont relu l'état du code juste avant l'exécution du plan, révélant des
faits que ce document ne connaissait pas encore à sa rédaction initiale :

- **`ViewPreferenceService`** : une préférence de vue (Tuiles/Tableau) **globale et partagée entre
  toutes les pages** (`localStorage`) écrasait silencieusement l'`@Input() defaultView` propre à
  chaque page dans `DataListComponent.ngOnInit()`. Sur les pages sans sélecteur de vue visible
  (`cardMode=false`), l'utilisateur n'avait aucun moyen de revenir en vue Tableau si la préférence
  globale pointait ailleurs — ce qui pouvait rendre les onglets réparés au P0 invisibles quand même,
  de façon non déterministe. Corrigé : quand `cardMode()` est `false`, `defaultView()` est
  maintenant la seule source de vérité, la préférence globale n'est prise en compte que quand un
  sélecteur de vue est effectivement visible.
- **Régression auto-introduite** : le correctif qui a fait fonctionner les tabs de `table-view` pour
  `enrollment-list` a eu pour effet de bord de pouvoir faire apparaître un **doublon d'onglets** sur
  `student-list` (ceux du `page-shell`, déjà fonctionnels, plus ceux nouvellement rendus par
  `table-view`) quand la préférence de vue globale valait `'table'`. Détecté et corrigé avant la fin
  de la session (retrait du binding redondant sur `student-list`).
- **`--fw-radius-2xl`** utilisé dans 5 fichiers (dont `.dossier-card`) mais jamais défini dans
  `_tokens.scss` → coins carrés au lieu d'arrondis. Ajouté (`28px`, cohérent avec la progression
  `sm:4 / md:8 / lg:16 / xl:24`).
- **`FwCardComponent`** (`app-fw-card`) existe déjà dans `shared/components/`, standalone et
  fonctionnel, mais sans aucun consommateur, et avec un langage visuel différent (style "dashboard")
  des 4 variantes de carte "dossier" unifiées ici. Volontairement laissé de côté — pas réutilisable
  tel quel pour `fw-info-card`, et pas dans le périmètre de cette unification.

---

*Voir aussi `DESIGN_AUDIT.md` pour le contexte historique (avril 2026) et l'état des composants
atomiques (`fw-button`, `fw-badge`, `fw-empty-state`).*
