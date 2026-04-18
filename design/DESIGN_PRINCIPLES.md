# Feewi — Principes du Design System

> Les principes sont le **pourquoi** du design system.  
> Ce sont des standards directeurs qui reflètent les valeurs de Feewi.  
> Chaque décision de design doit pouvoir se justifier par l'un d'eux.

---

## Anatomie d'un principe

Chaque principe Feewi est structuré en trois parties :
1. **La caractéristique** — Une affirmation courte et mémorable
2. **L'impact** — Ce que ça change pour l'utilisateur et pour l'école
3. **En pratique** — Questions d'équipe + suggestions concrètes

---

## Principe 1 — Clarté avant l'esthétique

> *"If a user needs to think about what to do, we've failed."*

### La caractéristique
Chaque écran, chaque composant, chaque message communique son intention instantanément. La beauté est une conséquence de la clarté — jamais l'inverse.

### Impact
**Pour le parent :** Il soumet son dossier sans frustration, sans ambiguïté sur ce qu'il doit faire ensuite.  
**Pour le secrétariat :** Elle traite 80 dossiers en une journée sans chercher où est le bouton, sans relire le label deux fois.  
**Pour Feewi :** Un utilisateur qui comprend est un utilisateur qui revient. La confusion génère des tickets de support et entame la confiance.

### Questions d'équipe
- Est-ce qu'un utilisateur qui voit cet écran pour la première fois sait quoi faire sans aide ?
- Est-ce que l'action principale est visuellement dominante ?
- Est-ce que les termes utilisés sont compris par quelqu'un qui ne connaît pas Feewi ?
- Y a-t-il des informations sur cet écran qui n'aident pas l'utilisateur à accomplir sa tâche ?

### En pratique
- Zéro jargon technique dans les interfaces (pas de "bundle", "pilier", "UUID") — réservé aux logs et aux développeurs
- Les boutons sont des verbes d'action : "Soumettre le dossier", "Vérifier", "Ajouter un enfant" — jamais "OK"
- Toute page a une et une seule action principale visuellement dominante
- Les messages d'erreur expliquent comment corriger, pas seulement ce qui ne va pas

---

## Principe 2 — Accessible par défaut

> *"Inaccessible products exclude people."*

### La caractéristique
L'accessibilité n'est pas une fonctionnalité ajoutée à la fin — elle est intégrée dès la conception. Le service Feewi est utilisable par le plus large public possible, incluant les personnes avec des handicaps permanents, temporaires, ou situationnels.

### Impact
**Pour les utilisateurs :** Qu'ils utilisent un lecteur d'écran, naviguent au clavier, aient une faible vision ou soient dans un environnement lumineux difficile, l'interface fonctionne.  
**Pour les écoles :** Elles respectent leurs obligations légales d'accessibilité numérique.  
**Pour Feewi :** Une interface accessible est une interface meilleure pour tous — le contraste élevé aide par soleil, la navigation clavier aide les power users.

### Questions d'équipe
- Est-ce que les ratios de contraste respectent WCAG AA (4.5:1 pour le texte, 3:1 pour les éléments UI) ?
- Est-ce que l'information est transmise uniquement par la couleur ? (si oui : ajouter une icône ou du texte)
- Est-ce qu'on peut naviguer sur toutes les pages avec un lecteur d'écran ?
- Est-ce que tous les éléments interactifs ont un `focus ring` visible ?
- Est-ce que toutes les images ont un `alt` text ?

### En pratique
- **WCAG AA minimum** sur tous les textes et composants UI
- Ne jamais utiliser la couleur seule pour communiquer un état — toujours accompagner d'une icône ou d'un texte
- Chaque élément interactif a un `focus ring` visible : `outline: 2px solid var(--fw-interactive); outline-offset: 2px`
- Respecter `prefers-reduced-motion` pour toutes les animations
- Tester les flux critiques (inscription, validation de dossier) avec un clavier uniquement

### Niveaux WCAG de référence
| Niveau | Ratio de contraste texte | Ratio UI | Notre cible |
|---|---|---|---|
| A | 3:1 | — | Minimum absolu |
| **AA** | **4.5:1** | **3:1** | **Notre standard** |
| AAA | 7:1 | — | Cible pour les contenus critiques |

---

## Principe 3 — Densité intentionnelle

> *"The right information for the right user at the right moment."*

### La caractéristique
Chaque interface affiche exactement ce dont son utilisateur a besoin — ni plus, ni moins. La densité varie selon le profil : le secrétariat a besoin de tableaux denses et d'actions rapides ; le parent a besoin de formulaires épurés et guidants.

### Impact
**Pour le parent :** Il ne se sent pas submergé. Chaque étape lui demande une seule chose.  
**Pour le secrétariat :** Elle n'a pas à cliquer 4 fois pour arriver à l'information. Les données critiques sont en surface.  
**Pour la direction :** Elle voit les KPIs en quelques secondes sans explorer des menus.

### Questions d'équipe
- Pour quel profil cette page est-elle conçue ? (voir `USER_PROFILES.md`)
- Y a-t-il des informations affichées que cet utilisateur n'utilisera jamais ?
- Y a-t-il des informations manquantes que cet utilisateur cherchera immédiatement ?
- La hiérarchie visuelle guide-t-elle l'œil dans le bon ordre ?

### En pratique
- Documenter le profil cible **avant** de designer une nouvelle page
- Les listes d'administration (secrétariat) peuvent afficher 8-10 colonnes — l'information dense est une feature, pas un bug
- Les formulaires parents n'affichent jamais plus d'un groupe de champs à la fois
- Les KPIs sont en haut à gauche — jamais après le fold

---

## Principe 4 — Cohérence systémique

> *"One solution per problem. If a component exists, use it."*

### La caractéristique
Le design system est la source unique de vérité. Un problème résolu dans un endroit est résolu partout. Réinventer une solution existante est un signe d'alerte — soit on améliore le système, soit on s'y conforme.

### Impact
**Pour les utilisateurs :** Ils apprennent l'interface une fois. Un badge vert signifie toujours la même chose. Un bouton de même aspect a toujours le même comportement.  
**Pour l'équipe :** Le temps de design et de développement diminue. On ne redébogue pas les mêmes patterns.  
**Pour Feewi :** L'application évolue sans régressions visuelles. Changer la couleur primaire se fait en une ligne.

### Questions d'équipe
- Existe-t-il déjà un composant ou un token pour ce besoin ?
- Si non, est-ce un besoin isolé (inline est acceptable) ou récurrent (créer un composant) ?
- Est-ce que ce nouveau composant respecte les tokens existants ?
- Est-ce que ce composant est documenté dans `DESIGN_SYSTEM_VISION.md` ?

### En pratique
- Tout nouvel usage d'une couleur non-tokenisée est une dette à signaler
- La règle du "deux fois" : si un pattern est utilisé deux fois, le composant est créé
- Aucun composant partagé ne contient de logique métier (pas de référence à un domaine applicatif)
- Consulter `DESIGN_AUDIT.md` avant de coder un nouveau composant

---

## Principe 5 — Évolution maîtrisée

> *"The system grows through consensus, not individual decisions."*

### La caractéristique
Le design system n'est pas figé — il évolue avec le produit. Mais chaque évolution est délibérée, documentée, et partagée. Les changements improvisés fragmentent le système.

### Impact
**Pour l'équipe design :** Les décisions sont traçables. On sait pourquoi un choix a été fait il y a 6 mois.  
**Pour l'équipe dev :** Les changements de tokens ou de composants sont prévisibles, pas des surprises en code review.  
**Pour Feewi :** Le produit gagne en maturité progressivement, sans régressions causées par des décisions isolées.

### Questions d'équipe
- Ce changement affecte-t-il un composant partagé ? (si oui : discussion d'équipe)
- Ce changement est-il documenté dans le design system avant d'être codé ?
- Qui est impacté par ce changement ? (autres pages, autres équipes)
- Est-ce qu'on peut faire ce changement de manière rétrocompatible ?

### En pratique
- Toute modification de token existant passe par une revue
- Toute suppression de composant partagé nécessite une migration documentée
- Le backlog du design system (`DESIGN_AUDIT.md`, section 11) est la voie officielle pour proposer des changements
- Les décisions de design importantes sont consignées avec leur justification dans ce dossier `/design`

---

## Résumé — Test rapide

Avant de livrer un composant ou une page, poser ces 5 questions :

| # | Question | Principe |
|---|---|---|
| 1 | Un utilisateur comprend-il immédiatement quoi faire ? | Clarté |
| 2 | L'interface est-elle navigable au clavier, avec un bon contraste ? | Accessibilité |
| 3 | L'information affichée est-elle calibrée pour ce profil ? | Densité intentionnelle |
| 4 | Utilise-t-on des tokens et composants existants ? | Cohérence systémique |
| 5 | La décision est-elle documentée ? | Évolution maîtrisée |

---

*Feewi Design Principles — Avril 2026*
