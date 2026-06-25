# Référence des Tokens de Couleur Feewi

## 1. Surfaces
| Token | Valeur | Usage |
|---|---|---|
| `--fw-surface-page` | `#f8fafc` | Fond de page principal |
| `--fw-surface-card` | `#ffffff` | Surface des cartes et modales |
| `--fw-surface-sunken` | `#f1f5f9` | Zone enfoncée (fond d'input, inner section) |
| `--fw-surface-inverse` | `#0f172a` | Surface inversée (sidebar, dark CTA) |
| `--fw-surface-overlay` | `rgba(15,23,42,0.5)` | Fond de modal/overlay |

## 2. Texte
| Token | Valeur | Usage |
|---|---|---|
| `--fw-text-primary` | `#0f172a` | Titre, contenu principal |
| `--fw-text-secondary` | `#475569` | Label, métadonnée, sous-titre |
| `--fw-text-tertiary` | `#94a3b8` | Placeholder, texte désactivé (Attention: contraste faible) |
| `--fw-text-inverse` | `#ffffff` | Texte sur fond sombre |
| `--fw-text-link` | `#2563eb` | Lien, action textuelle |

## 3. Interaction
| Token | Valeur | Usage |
|---|---|---|
| `--fw-interactive` | `#2563eb` | Bouton primaire, lien, focus ring |
| `--fw-interactive-hover` | `#1d4ed8` | État hover |
| `--fw-interactive-active` | `#1e40af` | État press |
| `--fw-interactive-subtle` | `rgba(37,99,235,0.08)` | Fond au hover léger |
| `--fw-interactive-focus` | `rgba(37,99,235,0.20)` | Halo de focus |

## 4. Statuts Métier
| Catégorie | Token Principal | BG | Border |
|---|---|---|---|
| **Success** | `--fw-status-success` (#10b981) | `-bg` (#f0fdf4) | `-border` (#a7f3d0) |
| **Warning** | `--fw-status-warning` (#f59e0b) | `-bg` (#fffbeb) | `-border` (#fde68a) |
| **Error** | `--fw-status-error` (#ef4444) | `-bg` (#fef2f2) | `-border` (#fecaca) |
| **Info** | `--fw-status-info` (#3b82f6) | `-bg` (#eff6ff) | `-border` (#bfdbfe) |
| **Neutral** | `--fw-status-neutral` (#64748b) | `-bg` (#f8fafc) | `-border` (#e2e8f0) |

## Accessibilité (WCAG AA)
- Texte normal (< 18px) : 4.5:1 minimum.
- UI Components : 3:1 minimum.
- **Note :** Ne jamais utiliser le blanc sur fond `--fw-status-success` (#10b981) car le ratio est de 2.9:1 (insuffisant). Utilisez du texte sombre.
