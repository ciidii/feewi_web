# Proposition de Rénovation UX/UI : Optimisation du Spacing dans le Shell Container

Ce document présente une proposition d'amélioration ergonomique et visuelle pour le layout de Feewi, en se focalisant sur la partie **`shell-container`** et son interaction avec le conteneur de page (`app-fw-page-shell`). 

---

## 1. Audit UX/UI : Diagnostic des Défauts Spatiaux Actuels

L'analyse de l'intégration visuelle entre la structure de la shell (`shell.component.html`/`scss`) et le composant page-shell (`page-shell.component.ts`/`scss`) met en évidence trois problèmes majeurs :

### A. L'Effet « Boîtes Imbriquées » (Alternance incohérente de surfaces)
- **Le constat :** La hiérarchie visuelle des couleurs de fond est inversée :
  1. `shell-container` : `--fw-raw-slate-50` (gris très clair).
  2. `shell-main` (zone de travail) : `--fw-raw-white` (blanc de fond) avec un padding de `16px`.
  3. `page-shell` : `--fw-surface-sunken` (gris bleuté `#f1f5f9`).
  4. Cartes internes : blanc.
- **L'impact :** Cela crée une bordure blanche de `16px` tout autour de la zone grise de la page. C'est un anti-pattern visuel de type « cadre photo » qui réduit l'immersion, fatigue l'œil en multipliant les sauts de contraste, et contredit la règle d'élévation où le fond de page doit être uniforme.

```
Actuel :
┌────────────────────────────────────────────────────────┐
│  Shell Container (Gris 50)                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Shell Main (Blanc - Padding 16px)                │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │  Page Shell (Gris 100)                     │  │  │
│  │  │  ┌──────────────────────────────────────┐  │  │  │
│  │  │  │  Cartes de Contenu (Blanc)           │  │  │  │
│  │  │  └──────────────────────────────────────┘  │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### B. Le Cumul Inutile d'Espacements (Pertes de pixels)
- **Le constat :** Les marges horizontales et verticales s'empilent :
  - `shell-main` impose un padding rigide de `16px`.
  - `page-shell .shell-body` impose un padding de `2rem` (soit `32px` en mode confortable).
- **L'impact :** Le contenu utile se trouve compressé par une marge totale de `48px` à gauche et à droite. Sur un écran moyen (1366px ou 1440px), cela réduit considérablement la surface disponible pour les tableaux de données et les tableaux de bord, provoquant du vide inutile au lieu d'une densité intentionnelle.

### C. Conflit de Scroll et Perte de Positionnement
- **Le constat :** Deux conteneurs partagent des propriétés de défilement : `.shell-main` a un `overflow-y: auto`, tandis que `.shell-body` a son propre `overflow-y: auto`.
- **L'impact :** En plus des risques de doubles barres de défilement, la scrollbar principale de `.shell-main` se retrouve décalée de `16px` du bord droit de l'écran en raison du padding. D'un point de vue de l'utilisabilité, la barre de défilement doit toujours coller au bord externe droit.

---

## 2. Notre Approche de Résolution UX/UI

En tant que designers UX/UI soucieux des détails, nous appliquons deux principes clés du Design System Feewi :
1. **La Densité Intentionnelle (Principe 3) :** L'espace libre doit servir la lisibilité et l'action du profil utilisateur. Il ne doit pas résulter d'un empilement de paddings CSS accidentel.
2. **La Responsabilité Unique :** La shell externe structure l'espace global ; le composant de contenu (`page-shell`) régit lui-même sa surface, ses paddings et son défilement.

### Solution Proposée :
- **Libérer `.shell-main` :** Supprimer son fond blanc, supprimer son padding de `16px`, et passer son comportement de défilement en `overflow: hidden`.
- **Rendre le contrôle à `app-fw-page-shell` :** Laisser la page s'étendre sur 100% de la largeur et hauteur disponible de la zone de travail. Son arrière-plan gris se fond ainsi naturellement contre le rail, la sidebar et le header principal.
- **Unifier le Spacing via les Design Tokens :** Remplacer les paddings hardcodés en pixels ou en rems par les tokens `--fw-space-xl` (confortable) et `--fw-space-md` (compact), qui s'ajustent dynamiquement via `--fw-space-multiplier`.
- **Corriger le Bug de la Classe Compact :** Lier l'input `density` dans `page-shell.component.ts` pour appliquer réellement la classe `.compact` sur le template.

---

## 3. Plan d'Action Technique (Détail du Code)

### 3.1 Modification de `shell.component.scss`
[Fichier à modifier](file:///C:/workspace/memoire/apps/feewi_web/src/app/core/layout/shell/shell.component.scss)

```scss
.shell-main {
  flex: 1;
  overflow: hidden; /* Résout définitivement le double scroll */
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background-color: transparent; /* Permet à l'arrière-plan de la page-shell de respirer */
  padding: 0; /* Plus de padding externe accidentel */

  .content-wrapper {
    flex: 1;
    width: 100%;
    height: 100%;
    contain: layout;
    display: flex;
    flex-direction: column;
  }
}
```

### 3.2 Correction de `page-shell.component.ts`
[Fichier à modifier](file:///C:/workspace/memoire/apps/feewi_web/src/app/shared/components/page-shell/page-shell.component.ts#L10-L12)

```typescript
// Injection de la classe compact pour refléter la densité demandée
template: `
  <div class="page-shell" 
       [class.has-tabs]="tabs && tabs.length > 0"
       [class.compact]="density === 'compact'">
       ...
  </div>
`
```

### 3.3 Modification de `page-shell.component.scss`
[Fichier à modifier](file:///C:/workspace/memoire/apps/feewi_web/src/app/shared/components/page-shell/page-shell.component.scss)

```scss
.page-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: var(--fw-surface-sunken); /* Fond gris harmonisé */

  /* HEADER AREA (Sticky) */
  .shell-header-area {
    background: transparent;
    z-index: 10;
    flex-shrink: 0;

    .shell-tabs-area {
      padding: 0 var(--fw-space-lg);
      margin-top: calc(-1 * var(--fw-space-sm)); 
      background: transparent;
    }
  }

  /* BODY AREA (Scrollable) */
  .shell-body {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: var(--fw-space-xl); /* Utilise la grille 8pt (32px par défaut) */

    .content-container {
      max-width: 1600px;
      margin: 0 auto;
      width: 100%;
      min-height: 100%;
    }
  }

  /* SPECIFICITY FOR COMPACT MODE */
  &.compact {
    .shell-header-area {
      background: white;
      box-shadow: var(--fw-shadow-sm);
    }

    .shell-body {
      padding: var(--fw-space-md); /* Utilise la grille 8pt (16px en mode compact) */
    }
  }
}
```

---

## 4. Bénéfices attendus (Indicateurs UX/UI de Succès)

```
Proposé :
┌────────────────────────────────────────────────────────┐
│  Shell Container (Gris 50)                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Page Shell (Gris 100 - Occupe 100% de la zone)  │  │
│  │  │                                                │  │  │
│  │  │  ┌──────────────────────────────────────────┐  │  │  │
│  │  │  │  Cartes de Contenu (Blanc)               │  │  │  │
│  │  │  └──────────────────────────────────────────┘  │  │  │
│  │  └────────────────────────────────────────────────┘  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

1. **Suppression de l'effet "Poupée Russe" :** La transition visuelle entre la Sidebar (Midnight), le Header (Slate 50), le fond de Page (Slate 100) et les Cartes de contenu (White) devient fluide et naturelle.
2. **Gain d'espace de travail net (Jusqu'à 32px économisés) :** La suppression du padding externe sur `.shell-main` redonne de la place aux tableaux de données et aux formulaires sur tous les breakpoints.
3. **Scroll impeccable et professionnel :** La scrollbar générale colle parfaitement à l'extrémité droite de l'écran, améliorant le contrôle de défilement pour l'utilisateur.
4. **Cohérence du Mode Compact :** En appliquant réellement la classe compact, les marges s'allègent dynamiquement sur les petits écrans de secrétariat où chaque pixel compte.
