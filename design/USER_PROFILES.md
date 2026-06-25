# Feewi — Profils Utilisateurs

> Document de référence pour guider les décisions de design et d'UX.  
> À relire avant toute nouvelle fonctionnalité ou revue de parcours.

---

## Vue d'ensemble

Feewi sert **trois domaines distincts** avec des utilisateurs aux contextes radicalement différents. Un design qui convient à l'un peut paralyser l'autre. Chaque décision de design doit mentionner explicitement le profil ciblé.

```
┌─────────────────────────────────────────────────────────┐
│  PARENT            SECRÉTARIAT        DIRECTION          │
│  /enrollment       /app               /app               │
│  Usage unique      Usage quotidien    Usage décisionnel  │
│  Mobile possible   Desktop exclusif   Desktop            │
└─────────────────────────────────────────────────────────┘
                                        ┌─────────────────┐
                                        │  SUPER ADMIN    │
                                        │  /saas-admin    │
                                        │  Feewi staff    │
                                        └─────────────────┘
```

---

## Profil 1 — Le Parent / Tuteur légal

**Domaine :** `/public/enrollment`  
**Fréquence d'utilisation :** 1 à 2 fois par an (saison des inscriptions)

### Qui est-il ?

Adulte de 28 à 55 ans. Il inscrit son enfant dans une école. C'est souvent la première fois qu'il utilise ce portail. Il n'a pas choisi d'utiliser Feewi — il y a été envoyé par l'école via un lien ou un flyer. Sa motivation principale est de **terminer la tâche le plus vite possible** pour reprendre sa journée.

Il peut être :
- Un parent pressé qui complète le formulaire entre deux réunions sur son téléphone
- Un parent anxieux qui craint de se tromper et veut être rassuré à chaque étape
- Un parent peu à l'aise avec le numérique qui relit deux fois chaque label

### Contexte d'usage

- **Appareil :** 50-60% mobile, 40-50% desktop
- **Connexion :** Potentiellement faible (3G/4G, zones rurales)
- **Durée :** 8 à 20 minutes pour un dossier complet
- **Environnement :** Souvent à la maison, parfois dans les transports
- **Documents nécessaires :** Il doit avoir des fichiers sous la main (photo, extrait de naissance) — source d'interruption

### Frustrations actuelles / risques

- Perdre sa saisie en cas de fermeture accidentelle
- Ne pas savoir où il en est dans le processus
- Ne pas comprendre pourquoi un champ est requis
- Ne pas savoir ce qu'il faut faire après avoir soumis

### Besoins design

| Besoin | Implication design |
|---|---|
| Réassurance constante | Indicateur de progression visible à tout moment |
| Clarté des labels | Zéro jargon administratif, aide contextuelle |
| Récupération de session | Codes référence et accès affichés en permanence |
| Mobile-first | Champs larges, CTA 48px+, pas de hover-only actions |
| Feedback immédiat | Validation en temps réel, messages d'erreur clairs |
| Sentiment de contrôle | Possibilité de revenir en arrière sans perdre de data |

### Ton attendu

Chaleureux, rassurant, clair. Comme un employé de secrétariat bienveillant qui guide pas à pas. Jamais condescendant. Jamais alarmiste.

---

## Profil 2 — Le Secrétariat

**Domaine :** `/app/admissions`  
**Fréquence d'utilisation :** 5 jours par semaine, plusieurs heures par jour

### Qui est-il ?

Agent administratif de 25 à 50 ans. Il traite des dizaines de dossiers par jour. Il connaît l'interface par cœur — ou devrait la connaître. Son objectif est la **vitesse** et la **précision**. Chaque clic économisé compte. Il travaille souvent sous pression pendant la saison des inscriptions (octobre-décembre, janvier-mars).

Il peut être :
- Une secrétaire unique dans une petite école gérant tout le flux
- Un agent dans un pool de 3-4 personnes dans un grand établissement
- Quelqu'un qui saisit des dossiers papier ("au guichet") en plus des dossiers numériques

### Contexte d'usage

- **Appareil :** Desktop exclusivement (grand écran, clavier physique)
- **Durée par session :** 4-6 heures continues
- **Charge :** 30 à 100 dossiers par jour en saison de pointe
- **Multi-tâche :** Souvent au téléphone ou face à un parent pendant la saisie

### Frustrations actuelles / risques

- Trop de clics pour des actions répétitives
- Devoir scroller pour trouver des informations en bas de page
- Interfaces qui masquent des informations derrière des menus
- Lenteur du chargement lors des transitions

### Besoins design

| Besoin | Implication design |
|---|---|
| Efficacité maximale | Raccourcis, bulk actions, filtres rapides |
| Densité d'information | Tableaux denses avec données clés visibles |
| Actions contextuelles | Menu d'actions directement sur chaque ligne |
| Feedback rapide | Toasts, états de chargement brefs |
| Lisibilité | Typographie claire, contraste suffisant pour fatigue oculaire |
| Stabilité | Pas d'animations longues, pas de comportements surprenants |

### Ton attendu

Neutre, efficace, professionnel. Pas besoin de chaleur — besoin de clarté. Les labels doivent être directs : "Vérifier", "Rejeter", pas "Confirmer que vous souhaitez...".

---

## Profil 3 — La Direction / Proviseur

**Domaine :** `/app/direction` + vues dashboard  
**Fréquence d'utilisation :** 2 à 5 fois par semaine, sessions courtes (15-30 min)

### Qui est-il ?

Décideur. 40-60 ans. Utilise l'interface pour valider des décisions pédagogiques, consulter des statistiques, et superviser le flux d'inscriptions. Il ne saisit pas de données — il prend des décisions sur celles qui existent. Il est souvent pressé et n'a pas de patience pour une interface confuse.

### Contexte d'usage

- **Appareil :** Desktop, parfois tablette
- **Objectif par session :** Valider un lot de dossiers, consulter un rapport, configurer une règle
- **Patience :** Faible — interface trop complexe = délégation au secrétariat

### Besoins design

| Besoin | Implication design |
|---|---|
| Vue d'ensemble rapide | Dashboard avec KPIs clés en surface |
| Actions décisionnelles claires | Boutons "Valider" / "Rejeter" proéminents |
| Pas de bruit visuel | Interface épurée, hiérarchie claire |
| Confiance | Données fiables, états bien affichés |

---

## Profil 4 — Le Super Administrateur SaaS

**Domaine :** `/saas-admin`  
**Fréquence d'utilisation :** Variable — de quotidien à hebdomadaire selon la phase

### Qui est-il ?

Employé Feewi. Profil technique ou opérationnel. Il crée des comptes d'école, configure des environnements, diagnostique des problèmes, surveille la plateforme. Il est à l'aise avec les interfaces denses et les termes techniques.

### Contexte d'usage

- **Appareil :** Desktop exclusivement
- **Objectif :** Gérer le parc d'écoles clientes, onboarder de nouveaux tenants
- **Attention :** Peut gérer plusieurs onglets simultanément

### Besoins design

| Besoin | Implication design |
|---|---|
| Information dense | Plus de contenu par page que pour les autres profils |
| Actions dangereuses protégées | Confirmations pour suspend/delete |
| Contexte clair | Toujours savoir sur quel tenant on travaille |
| Outils de diagnostic | Logs, statuts techniques visibles |

---

## Matrice de décision

Quand une décision de design crée une tension entre profils, utiliser cette matrice :

| Contexte | Priorité |
|---|---|
| Formulaire public d'inscription | Parent > tout autre |
| Liste de dossiers + filtres | Secrétariat > Direction |
| Tableau de bord / KPIs | Direction > Secrétariat |
| Configuration du portail | Secrétariat (si simple) / Direction (si stratégique) |
| Gestion des tenants | Super Admin exclusif |

---

*Feewi Design — Document Profils Utilisateurs — Avril 2026*
