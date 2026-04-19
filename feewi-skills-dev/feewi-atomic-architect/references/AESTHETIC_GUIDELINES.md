# Directives Esthétiques Feewi

## 1. Élévation (Modèle à 4 niveaux)
- **Niveau 0 :** Fond de page (`--fw-surface-page`).
- **Niveau 1 :** Carte posée (shadow-sm).
- **Niveau 2 :** Carte interactive au hover (shadow-md).
- **Niveau 3 :** Modale / Drawer (shadow-lg).
- **Niveau 4 :** Popover / Toast (shadow-xl).

## 2. États Interactifs
Chaque élément cliquable doit définir :
- **Hover :** Légère élévation ou changement de fond.
- **Focus :** Outline de 2px `--fw-interactive` avec un offset de 2px.
- **Active (Press) :** Légère réduction d'échelle (scale 0.98) ou fond plus sombre.
- **Disabled :** Opacité 0.5, curseur `not-allowed`.

## 3. Mouvements (Transitions)
- **Rapide (Fast) :** 150ms ease (Hovers, feedbacks simples).
- **Standard :** 250ms cubic-bezier (Ouverture de modale, transitions de page).
- **Lent (Slow) :** 400ms (Animations complexes).
