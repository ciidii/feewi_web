# Plan de Migration Feewi

## Phase 1 : Fondations (Semaine 1-2)
- Remplacement des couleurs hardcodées par les tokens sémantiques dans `_tokens.scss`.
- Implémentation de `fw-button` et `fw-badge`.

## Phase 2 : Remplacement Atomique (Semaine 3-4)
- Migration de tous les boutons Tailwind vers `app-fw-button`.
- Migration des badges de statut vers `app-fw-badge`.

## Phase 3 : Structurelle (Semaine 5+)
- Unification des styles d'inputs.
- Implémentation de `fw-empty-state`.
- Migration vers `fw-tabs` (6 implémentations à unifier).
