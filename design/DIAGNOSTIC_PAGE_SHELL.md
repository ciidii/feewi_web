# Diagnostic UX/UI : Alignement et Spacing du Page-Shell

Ce document présente un diagnostic en profondeur du composant **`app-fw-page-shell`** et de son en-tête **`app-fw-page-header`**, en analysant le spacing (paddings, hauteurs, marges) et l'alignement de la grille horizontale.

---

## 1. Audit d'Alignement Horizontal (Les Défauts Constatés)

Le rôle premier d'une "page-shell" institutionnelle est de définir une **ligne d'alignement vertical commune (Grid line)** pour que l'œil de l'utilisateur puisse balayer la page sans à-coups visuels. Actuellement, cette ligne est brisée à cause de valeurs de padding divergentes :

### A. En Mode Confortable (Comfortable)
- **Header de page (`.page-header`) :** `padding: 0 2rem;` (soit **32px** à gauche).
- **Zone des onglets (`.shell-tabs-area`) :** `padding: 0 var(--fw-space-lg);` (soit **24px** à gauche).
- **Corps de page (`.shell-body`) :** `padding: var(--fw-space-xl);` (soit **32px** de padding global).
- **Impact visuel :** Les onglets démarrent 8px plus à gauche que le titre de la page et que le contenu de la table. Cet écart de 8px crée une impression de décalage inesthétique.

### B. En Mode Compact (Compact)
- **Header de page (`.page-header.compact`) :** Hérite de `padding: 0 2rem;` (soit **32px**).
- **Zone des onglets (`.shell-tabs-area`) :** Reste à `padding: 0 var(--fw-space-lg);` (soit **24px**).
- **Corps de page (`.shell-body.compact`) :** Redescend à `padding: var(--fw-space-md);` (soit **16px**).
- **Impact visuel :** C'est la rupture complète de l'alignement :
  - Le titre est à **32px** du bord gauche.
  - Les onglets sont à **24px** du bord gauche.
  - Le contenu de la table commence à **16px** du bord gauche.
  Cette dissonance donne un aspect désorganisé à l'interface en mode compact.

### C. En Mode Mobile (< 768px)
- **Header de page (`.page-header`) :** Redescend à `padding: 1.5rem;` (soit **24px**).
- **Zone des onglets (`.shell-tabs-area`) :** Redescend à `padding: 0 var(--fw-space-md);` (soit **16px**).
- **Corps de page (`.shell-body`) :** Redescend à `padding: var(--fw-space-md);` (soit **16px**).
- **Impact visuel :** Alignement brisé : en-tête décalé de 8px vers la droite par rapport aux onglets et au contenu.

---

## 2. Audit Vertical, Bordures et Surfaces

### A. Conflit de Bordure en Mode Compact
- **Le problème :** Lorsque le mode compact est activé :
  - `.page-header.compact` reçoit une bordure inférieure : `border-bottom: 1px solid var(--fw-border-subtle)` et un fond blanc.
  - `.shell-tabs-area` possède une marge supérieure négative : `margin-top: calc(-1 * var(--fw-space-sm))` (soit `-8px`) pour se rapprocher de l'en-tête.
- **L'impact :** La bordure inférieure de l'en-tête traverse horizontalement les onglets ou s'affiche juste au-dessus, créant une superposition graphique confuse.
  De plus, en mode compact, la shell-header-area reçoit une ombre `box-shadow` globale. Nous avons donc une double ombre/bordure qui s'applique sur des éléments imbriqués.

---

## 3. Solution UX/UI : La Grille d'Alignement Unifiée

Pour garantir un alignement vertical absolu quel que soit le breakpoint ou la densité, nous proposons d'introduire une propriété CSS personnalisée héritée : **`--fw-page-padding-x`**.

Cette variable est définie au niveau du parent `.page-shell` et est lue par le header, les onglets et le corps de page :

| Mode | `--fw-page-padding-x` | Résultat d'alignement |
|---|---|---|
| **Confortable** | `var(--fw-space-xl)` (32px) | **Header, Onglets et Corps alignés à 32px** |
| **Compact** | `var(--fw-space-lg)` (24px) | **Header, Onglets et Corps alignés à 24px** |
| **Mobile** | `var(--fw-space-md)` (16px) | **Header, Onglets et Corps alignés à 16px** |

### Restructuration des Bordures & Arrière-plans :
1. Déplacer la responsabilité du fond blanc et de la bordure inférieure du header compact vers le conteneur global `.shell-header-area`. Ainsi, que la page ait des onglets ou non, le bloc d'en-tête reste unifié avec une seule ligne de séparation à sa base.
2. Nettoyer les hauteurs fixes et utiliser les tokens d'espacement pour les hauteurs de composants.

---

## 4. Propositions de Modifications de Code

### 4.1 Dans `page-shell.component.scss`
[Fichier à modifier](file:///C:/workspace/memoire/apps/feewi_web/src/app/shared/components/page-shell/page-shell.component.scss)

```scss
.page-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: var(--fw-surface-sunken);
  
  /* 1. Définition de la grille horizontale unique */
  --fw-page-padding-x: var(--fw-space-xl); /* 32px par défaut */

  /* HEADER AREA (Sticky) */
  .shell-header-area {
    background: transparent;
    z-index: 10;
    flex-shrink: 0;
    transition: all 0.3s ease;

    .shell-tabs-area {
      padding: 0 var(--fw-page-padding-x); /* Alignement parfait */
      margin-top: calc(-1 * var(--fw-space-sm));
      background: transparent;
    }
  }

  /* BODY AREA (Scrollable) */
  .shell-body {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: var(--fw-space-xl) var(--fw-page-padding-x); /* Top/Bottom XL, Gauche/Droite dynamique */

    .content-container {
      max-width: 1600px;
      margin: 0 auto;
      width: 100%;
      min-height: 100%;
    }
  }

  /* SPECIFICITY FOR COMPACT MODE */
  &.compact {
    --fw-page-padding-x: var(--fw-space-lg); /* 24px d'alignement en compact */

    .shell-header-area {
      background: white;
      border-bottom: 1px solid var(--fw-border-subtle); /* Séparation propre et unifiée */
      box-shadow: var(--fw-shadow-sm);
    }

    .shell-body {
      padding: var(--fw-space-md) var(--fw-page-padding-x);
    }
  }
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .page-shell {
    --fw-page-padding-x: var(--fw-space-md); /* 16px sur mobile */

    .shell-header-area {
      .shell-tabs-area {
        padding: 0 var(--fw-page-padding-x);
      }
    }

    .shell-body {
      padding: var(--fw-space-md) var(--fw-page-padding-x);
    }
  }
}
```

### 4.2 Dans `page-header.component.scss`
[Fichier à modifier](file:///C:/workspace/memoire/apps/feewi_web/src/app/shared/components/page-header/page-header.component.scss)

```scss
.page-header {
  height: 96px; 
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--fw-page-padding-x, 2rem); /* Hérite de l'alignement horizontal global */
  background: transparent;
  border: none;
  font-family: var(--fw-font-sans);
  transition: all 0.3s ease;

  &.compact {
    height: 72px;
    background: transparent; /* Fond délégué au conteneur de la shell */
    border-bottom: none;       /* Bordure déléguée au conteneur de la shell */
    
    .icon-container { width: 36px; height: 36px; border-radius: 8px; }
    .page-title { font-size: 1.125rem; }
    .page-desc { display: none; }
    .btn-back { width: 36px; height: 36px; border-radius: 8px; }
  }
}

@media (max-width: 768px) {
  .page-header { 
    padding: var(--fw-space-md) var(--fw-page-padding-x, 1rem); 
    height: auto; 
    flex-direction: column; 
    align-items: flex-start; 
    gap: var(--fw-space-sm); 
  }
}
```
