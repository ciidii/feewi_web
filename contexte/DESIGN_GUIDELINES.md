# Charte Design : Institutionnel & Professionnel (Feewi)

Ce document définit les principes esthétiques et ergonomiques du portail Feewi pour garantir une image de **confiance, de rigueur et de pérennité**.

## 1. Vision du Design
L'interface doit s'effacer au profit de l'action utilisateur tout en dégageant une impression de solidité institutionnelle.
*   **Mots-clés** : Autorité, Précision, Sobriété, Performance.

---

## 2. Principes Fondamentaux

### A. Géométrie et Structure (L'Architecture)
*   **Système de Grille** : Utilisation stricte du multiple de **8px** pour tous les espacements (padding, margin).
*   **Rayons de Courbure (Border Radius)** :
    *   `Standard` : **12px** (équilibre entre modernité et sérieux).
    *   `Interactif` (Boutons/Inputs) : **8px** (précision technique).
    *   *Note : On abandonne les arrondis de 24px jugés trop "soft".*
*   **Bordures** : Utilisation de bordures fines (**1px**) avec des contrastes bas (`#e2e8f0`) pour délimiter les zones sans alourdir.

### B. Typographie (L'Autorité)
*   **Titres (Display)** : `Lexend`. Graisses : **600** (Semibold) pour le corps de titre, **700** (Bold) pour l'emphase.
*   **Corps de texte (Sans)** : `Inter`. Lisibilité maximale, espacement des lettres (letter-spacing) neutre, interlignage (line-height) aéré (1.5 à 1.6).
*   **Hiérarchie** : Utilisation de la couleur `Slate-500` pour les textes secondaires afin de réduire la charge cognitive.

### C. Palette Chromatique (La Sobriété)
*   **Primaire (Action)** : `Midnight Blue` (#2563eb). Utilisation ciblée pour les appels à l'action.
*   **Neutres (Structure)** :
    *   `Midnight Slate` (#0f172a) : Pour les textes principaux et les éléments d'autorité.
    *   `Ice Blue` (#f8fafc) : Pour les fonds de page (évite l'agressivité du blanc pur).
*   **Sémantique** : Couleurs de statut (Succès, Erreur, Alerte) désaturées pour un rendu plus "mat" et professionnel.

### D. Profondeur et Élévation (Les Ombres)
*   **Ombres Stratifiées** : Pas d'ombres portées simples. Utilisation d'ombres à deux couches :
    1.  Une ombre de contact (fine, sombre, peu de flou).
    2.  Une ombre de diffusion (large, très claire, beaucoup de flou).
*   **Objectif** : Donner l'impression que les éléments "reposent" physiquement sur l'interface.

---

## 3. Composants Clés

### Header & Navigation
*   **Effet Glassmorphism** : `backdrop-filter: blur(8px)` avec un fond blanc translucide (opacity 80-90%).
*   **Sticky Header** : Toujours disponible pour rassurer l'utilisateur sur sa position.

### Cartes (Cards)
*   **État de repos** : Bordure simple, sans ombre ou ombre très légère.
*   **État de survol (Hover)** : Élévation subtile (**-4px**) avec une ombre de diffusion renforcée. Pas de changement de couleur brutal.

### Formulaires
*   **Inputs** : Fond blanc, bordure Slate-200. Focus avec une lueur (glow) de 3px très diffuse de la couleur primaire.
*   **Boutons** : États de survol basés sur l'assombrissement de la couleur (shade) plutôt que sur le changement de teinte.

---

## 4. Mouvement et Interaction
*   **Transitions** : Durée fixe de **200ms** à **300ms**.
*   **Courbe Bézier** : `cubic-bezier(0.4, 0, 0.2, 1)`. Un mouvement qui commence vite et finit doucement, mimant la physique réelle.
*   **Feedback** : Toute action utilisateur doit entraîner une réponse visuelle immédiate (micro-déplacement, changement de couleur subtil).
