# Système Spatial Feewi (8pt Grid)

## 1. Grille de Base
Toutes les valeurs sont des multiples de 4px ou 8px.

| Token | Valeur | Usage |
|---|---|---|
| `Micro` | 2px | Séparation atomique (icon + text inline) |
| `XS` | 4px | Padding de badge, micro-espacement |
| `SM` | 8px | Padding interne compact |
| `SM+` | 12px | Padding d'item de liste |
| `MD` | 16px | Espacement standard entre champs (Défaut) |
| `MD+` | 20px | Espacement entre groupes |
| `LG` | 24px | Espacement entre sections de carte |
| `XL` | 32px | Padding de carte, espacement entre cartes |
| `2XL` | 40px | Padding de page mobile/tablet |
| `3XL` | 48px | Padding de page desktop |
| `4XL` | 64px | Espacement entre blocs majeurs |

## 2. Grille de Densité (Enterprise Ready)
Impératif : Gérer deux modes d'affichage pour les utilisateurs experts.

- **Mode Compact :** Spacing de base 8px (utilisé pour les Data Tables et listes denses).
- **Mode Comfortable :** Spacing de base 16px (utilisé pour les formulaires et pages de lecture).

## 3. Accessibilité & Contrastes
- **Standard :** WCAG AA (4.5:1).
- **High Contrast Mode :** Doit viser WCAG AAA (7:1) pour la conformité légale (ADA).
- **Mode Daltonien :** Toujours utiliser des formes ou icônes en plus de la couleur pour les graphiques.

## 4. Breakpoints
- **Mobile :** < 768px
- **Tablet :** 768-1024px
- **Desktop SM :** 1024-1280px
- **Desktop LG :** > 1280px

## 5. Rythme Vertical
La hauteur de tous les composants interactifs doit être un multiple de 4px ou 8px :
- Bouton MD : 40px
- Input MD : 44px
- Header : 72px
