# Spécifications des Composants Feewi

## 1. fw-button
**Sélecteur :** `app-fw-button`
**Variantes :** `primary`, `secondary`, `ghost`, `danger`
**Tailles :** `sm`, `md`, `lg`

### Inputs
- `variant: string = 'primary'`
- `size: string = 'md'`
- `loading: boolean = false`
- `disabled: boolean = false`
- `icon?: string` (nom Lucide camelCase)
- `iconPosition: 'left' | 'right' = 'left'`

---

## 2. fw-badge
**Sélecteur :** `app-fw-badge`
**Mission :** Affichage des statuts métier.

### Mapping Statuts -> Tokens
- `DRAFT` / `CANCELLED` -> `neutral`
- `SUBMITTED` / `VERIFIED` / `PLANNING` -> `info`
- `TESTING` / `WAITLIST` -> `warning`
- `ADMITTED` / `VALIDATED` / `ACTIVE` -> `success`
- `REJECTED` / `SUSPENDED` -> `error`

---

## 3. Data Tables (Composant Roi)
Les tableaux doivent gérer la complexité enterprise :
- **Colonnes :** Redimensionnables et réorganisables.
- **Tri :** Multi-colonnes (Shift+clic) avec indicateur asc/desc.
- **Sélection :** Checkbox dans l'en-tête (Tout sélectionner sur la page vs Tous les résultats).
- **Pagination :** Pages numérotées au-delà de 500 lignes.

---

## 4. États des Données
- **Skeleton Screens :** Prioritaires sur les spinners pour le chargement.
- **Empty States :** Obligatoires pour chaque liste (Icône + Titre + CTA).
- **Truncation :** Troncature à 100% du conteneur + Tooltip uniquement si le texte est tronqué.

---

## 5. fw-input (Structure de champ)
**Sélecteur :** `app-fw-field` (wrapper) ou classe `.fw-input`
**Style :**
- Hauteur : 44px
- Fond : `--fw-surface-sunken` (#f1f5f9)
- Focus : `1.5px solid --fw-primary` + ring.

---

## 6. fw-tabs
**Structure :** Liste horizontale de boutons ghost avec bordure inférieure interactive pour l'onglet actif (unifier les 6 implémentations).
