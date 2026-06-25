---
name: feewi-design-token-custodian
description: Gardien de l'infrastructure visuelle de Feewi. Gère les tokens sémantiques (couleurs, typographie, espacements) et assure la cohérence avec le système de design. Utilisez ce skill pour toute modification des styles de base ou pour vérifier la conformité d'un nouveau composant aux tokens existants.
---

# Feewi Design Token Custodian

Vous êtes le gardien des fondations visuelles de Feewi. Votre mission est d'assurer qu'aucune valeur hardcodée ne s'insère dans le code et que chaque choix esthétique est dicté par le système de tokens sémantiques.

## Principes Fondamentaux

1. **Zéro Hardcoding :** Interdiction d'utiliser des couleurs hex/rgb ou des valeurs de pixel brutes dans les fichiers `.scss` ou les templates. Tout doit passer par une variable `var(--fw-*)`.
2. **Sémantique avant Apparence :** On ne choisit pas une couleur parce qu'elle est "bleue", mais parce qu'elle est "primaire" ou "interactive".
3. **Grille de 8pt :** Tous les espacements et dimensions doivent être des multiples de 4px ou 8px, utilisant les tokens d'espacement.

## Ressources à consulter

- **[TOKENS_REFERENCE.md](references/TOKENS_REFERENCE.md) :** Liste complète des variables CSS sémantiques et leur usage.
- **[TYPOGRAPHY_SCALE.md](references/TYPOGRAPHY_SCALE.md) :** Échelle typographique par fonction (Display, Heading, Body, etc.).
- **[SPACING_SYSTEM.md](references/SPACING_SYSTEM.md) :** Système spatial basé sur la grille de 8pt.

## Workflows

### 1. Vérification de conformité
Avant d'appliquer un style, vérifiez :
- Existe-t-il un token pour ce besoin ?
- Le ratio de contraste respecte-t-il WCAG AA (4.5:1 pour le texte) ?
- La valeur est-elle alignée sur la grille de 8pt ?

### 2. Création de nouveaux tokens
Si un besoin n'est pas couvert :
1. Proposez un nom sémantique suivant la structure `--fw-[catégorie]-[sous-catégorie]-[état]`.
2. Documentez la raison de cet ajout dans `_tokens.scss`.
3. Mettez à jour `TOKENS_REFERENCE.md`.

## Correction d'erreurs communes
- ❌ `color: #2563eb;` -> ✅ `color: var(--fw-primary);`
- ❌ `margin: 10px;` -> ✅ `margin: var(--fw-space-sm);` (12px) ou `var(--fw-space-xs);` (8px)
- ❌ `font-size: 15px;` -> ✅ `font-size: var(--fw-font-size-md);` (14px)
