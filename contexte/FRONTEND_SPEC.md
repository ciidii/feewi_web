# Spécifications Fonctionnelles & Architecture Frontend : Feewi (Ecosystème Shell)

## 1. Vision & Expérience Utilisateur (UX)
L'interface de Feewi s'inspire de l'ergonomie des solutions **Google Workspace**. L'objectif est d'offrir un environnement de travail clair, aéré et centré sur la recherche d'informations, où chaque application métier s'intègre naturellement dans un "Shell" commun.

### 1.1 Structure du Shell "Google-Style"
L'application est structurée autour d'un cadre permanent (Le Shell) qui accueille les différents modules :

1.  **Le Header Supérieur (Permanent) :**
    *   **Gauche :** Logo Feewi + Nom de l'établissement (Tenant).
    *   **Centre :** Barre de recherche omniprésente (Omnisearch) pour trouver rapidement un élève, unIdentity & Sécurité enseignant ou un document.
    *   **Droite :** 
        *   Sélecteur d'année scolaire (ex: 2024-2025).
        *   Menu "Gaufre" (App Launcher) pour basculer entre les applications (Admissions, Scolarité, SaaS Admin).
        *   Profil utilisateur & Notifications.

2.  **Le Rail de Navigation (Extrême gauche) :**
    *   Un rail vertical étroit contenant les icônes des applications principales.
    *   Permet une bascule rapide sans ouvrir le menu "Gaufre".

3.  **La Sidebar de l'Application (Collapsible) :**
    *   Située juste à droite du rail ou remplaçant celui-ci selon le contexte.
    *   Contient la navigation interne de l'application active (ex: pour "Scolarité" : Classes, Élèves, Emplois du temps).
    *   Comprend un bouton d'action principal en haut (ex: "Nouvelle Inscription", "Ajouter un Élève") inspiré du bouton "Nouveau" de Gmail/Drive.

4.  **Zone de Contenu Principale :**
    *   Affichage des données sous forme de listes épurées, de tableaux de bord ou de formulaires.

---

## 2. Stack Technique & Justification
Pour Feewi, nous privilégions une architecture hybride **Composants Robustes + Design Agile** :

*   **Angular Material 3 (M3) :** Choisi pour l'**ossature**. Il fournit les composants complexes (Calendriers, Modales, Menus) avec une accessibilité native (A11Y) et l'ergonomie Google Workspace. (Remplaçant avantageusement Bootstrap par sa richesse fonctionnelle).
*   **Tailwind CSS :** Choisi pour l'**esthétique et la précision**. Il remplace l'écriture massive de SCSS/CSS personnalisé, permettant d'appliquer notre branding "Mono-SaaS" (espacements, arrondis, typographie) directement dans le HTML via des classes utilitaires performantes.
*   **SCSS :** Utilisé uniquement pour la configuration du thème global Material 3 (thématisation M3) et l'injection des variables de branding.

---

## 6.5 Configuration Technique (Design Tokens)

### 6.5.1 Tailwind Configuration
Le fichier `tailwind.config.js` intégrera notre identité visuelle propre :
*   **Colors :** Extension de la palette `slate` pour les neutres et définition de `primary: '#2563EB'` (Indigo Cobalt).
*   **Fonts :** 
    *   `sans: ['Inter', 'ui-sans-serif', 'system-ui']`
    *   `display: ['Lexend', 'sans-serif']`
*   **Border Radius :** `8px` (default), `16px` (md), `24px` (lg).

## 7. Pages Systèmes (Transverses)
Ces pages constituent le socle de l'application, indépendamment des modules métiers.

### 7.1 Authentification & Onboarding
*   **Login Page :** Focus sur la simplicité et la sécurité (M3 Outlined Fields).
*   **Reset Password Flow :** Parcours de récupération d'accès.
*   **Tenant Switcher :** Page de sélection pour les utilisateurs multi-établissements.

### 7.2 Portail Central (L'Entrée)
*   **Global Dashboard :** Vue d'ensemble agrégée (Widgets d'activités, notifications, raccourcis).
*   **Notifications Tray :** Historique des alertes système et messages importants.

### 7.3 Paramètres Utilisateurs & Sécurité
*   **User Profile :** Gestion des informations personnelles et de l'avatar.
*   **Security Center :** Changement de mot de passe et gestion des sessions actives.
*   **UI Preferences :** Réglages de densité d'affichage et de langue.

## 8. Focus Module : Identity & Sécurité
Le module Identity est le garant de la confiance et de l'isolation SaaS.

### 8.1 Architecture de Sécurité (Core)
*   **AuthInterceptor :** Injecte le `Bearer JWT` et le `X-Tenant-ID` dans chaque requête.
*   **RbacGuard :** Protection des routes basée sur les permissions extraites du JWT (ex: `canActivate: [PermissionGuard], data: { perm: 'school:write' }`).
*   **SessionManager :** Gère l'expiration du token et la redirection vers la page de login avec sauvegarde de l'URL de retour (`returnUrl`).

### 8.2 Expérience SaaS Admin (System Level)
Pour le `SYSTEM_ADMIN`, le module Identity se manifeste comme une console de pilotage :
*   **Tenant Manager :** Utilise le modèle `Smart Data-List` pour superviser les établissements.
*   **Impersonation Flow :** Interface sécurisée permettant au support technique de "devenir" un admin d'école (avec bandeau d'alerte persistant dans le Shell).

### 8.3 Gestion du Personnel & Rôles (School Level)
Pour le `SCHOOL_ADMIN`, l'interface permet de gérer l'autonomie de l'école :
*   **Staff Directory :** Liste intelligente du personnel avec gestion des accès.
*   **Role Designer :** Interface simplifiée pour mapper les permissions système vers des rôles locaux personnalisés.
*   **Audit Trail :** Consultation des logs d'audit filtrés par tenant pour la traçabilité des actions administratives.

---

## 6. Design System & Identité Visuelle

### 6.1 Fondations Visuelles
Le design system de Feewi suit les directives de **Material Design 3 (M3)** pour une cohérence maximale avec l'écosystème Google Workspace :
*   **Typographie :** `Inter` ou `Roboto` (Sans-serif) pour une lisibilité optimale sur les données denses.
*   **Palettes de Couleurs :** Utilisation des rôles de couleur M3 (Primary, Secondary, Surface, Outline). Le "Bleu Feewi" est la couleur par défaut, mais chaque école peut injecter sa propre couleur primaire via des CSS Variables.
*   **Surfaces :** Utilisation de fonds gris très clairs (`surface-container`) avec des éléments de contenu sur fond blanc pur pour créer de la hiérarchie.

### 6.2 Composants Signature
*   **Bouton "Hero" :** Un bouton d'action principal de type `Extended FAB` (avec icône et texte) situé en haut de la sidebar.
*   **Champs de Saisie :** Style "Outlined" (borduré) pour une meilleure clarté dans les formulaires complexes.
*   **Dialogues :** Utilisation de modales centrées avec des coins arrondis (28px) conformes au standard M3.

### 6.4 Branding & Identité Visuelle "Feewi" (Mono-SaaS Edition)
L'identité visuelle de Feewi adopte une approche **Monochromatique Premium**, transformant l'outil en une console de précision administrative.

#### 6.4.1 Palette Chromatique "Midnight Slate"
La palette est construite sur une seule rampe de teintes (Indigo/Slate) pour une sobriété maximale :
*   **Primary Action :** `#2563EB` (Cobalt) - L'unique point de couleur vive pour l'interaction.
*   **Deep Text :** `#0F172A` (Midnight) - Utilisé pour les titres et le texte principal.
*   **Medium Slate :** `#64748B` - Pour les labels et métadonnées secondaires.
*   **Surface Light :** `#F8FAFC` (Ice) - Fond principal de l'application, réduisant la fatigue visuelle.
*   **Border :** `#E2E8F0` - Pour une séparation subtile et élégante des zones.

#### 6.4.2 Philosophie "Hierarchy through Contrast"
Le design s'appuie sur le contraste plutôt que sur la couleur :
*   **Typographie :** `Lexend` pour les titres (affirmation de la structure) et `Inter` pour les données (précision).
*   **Micro-Accents :** Utilisation de variations de saturation très légères pour les statuts (ex: un bleu très désaturé pour un dossier "en attente").
*   **Whitespace :** L'espace blanc est considéré comme un élément de design actif, facilitant la lecture des données denses (élèves, notes).

#### 6.4.3 Iconographie & Formes
*   **Icons :** `Lucide Icons` en tracé fin (1.5px) pour une esthétique moderne et épurée.
*   **Bords :** Rayons de courbure fixes de `8px` pour une sensation de robustesse et de modernité contrôlée.

---

## 3. Architecture des Modules Frontend

### 3.1 Le "Shell" Global (Architecture Détaillée)
Le Shell est le composant racine (`AppComponent` ou `ShellComponent`) qui orchestre l'expérience utilisateur. Il est composé de quatre sous-composants intelligents :

#### 3.1.1 Composants du Shell
1.  **HeaderComponent :** 
    *   **Omnisearch :** Barre de recherche centrale (Ctrl+K). Recherche contextuelle et globale.
    *   **App Launcher (Gaufrier) :** Menu `Overlay` affichant les applications autorisées.
    *   **Tenant Brand :** Logo et nom de l'établissement avec sélecteur d'école (si multi-tenant).
2.  **AppRailComponent :** Rail vertical étroit (64px) à l'extrême gauche pour les icônes de haut niveau (Home, Notifications, Settings).
3.  **ContextualSidebarComponent :** 
    *   Barre latérale rétractable contenant la navigation spécifique au module actif.
    *   **Bouton d'Action Primaire :** Bouton "Hero" dynamique (ex: "+ Admission", "+ Élève").
4.  **MainContentComponent :** Zone de rendu principale utilisant `<router-outlet>` avec gestion indépendante du scroll.

#### 3.1.2 Gestion des États (Services & Signals)
Le Shell utilise les **Signals** d'Angular pour une synchronisation fluide :
*   **TenantContextService :** Gère le `tenantId` actif, le logo et les préférences de branding. Expose un Signal `activeTenant`.
*   **NavigationStateService :** Gère l'état `expanded/collapsed` de la sidebar et le fil d'ariane.
*   **AppLauncherService :** Filtre les modules affichés dans le gaufrier selon les permissions du JWT.

#### 3.1.3 Injection du Contexte & Sécurité
*   **TenantInterceptor (HTTP) :** Intercepte chaque requête sortante pour injecter systématiquement les headers `Authorization` (Bearer JWT) et `X-Tenant-ID`.
*   **Dynamic Branding :** Injection de variables CSS au runtime (ex: `--primary-color`) pour adapter l'interface aux couleurs de l'école.

#### 3.1.4 Comportement de l'Omnisearch
*   **Recherche Typée :** Résultats groupés (Élèves 🎓, Personnel 👥, Actions ⚙️).
*   **Rapidité :** Utilisation de `debounceTime` et `switchMap` pour des résultats instantanés.

### 3.2 Module : SaaS System Admin
*   **Interface :** Similaire à une console d'administration Google.
*   **Fonctionnalités :** Liste des écoles, gestion des licences, monitoring système.

### 3.3 Module : School Management (Scolarité)
*   **Focus :** Gestion des référentiels (Élèves, Classes).
*   **UX :** Recherche filtrable puissante, fiches élèves détaillées.

### 3.4 Module : Enrollment (Inscriptions)
*   **Interface :** Type "Boîte de réception" pour les demandes d'admission (inspiré de Gmail).
*   **Flux :** Tri, vérification et validation des dossiers.

---

## 4. Concepts d'Interface

### 4.1 Recherche Omniprésente
La barre de recherche en haut est le point d'entrée principal. Elle doit être contextuelle : si je suis dans "Inscriptions", elle cherche d'abord les dossiers, si je suis dans "Scolarité", elle cherche les élèves.

### 4.2 Bouton d'Action Flottant / Principal
Chaque application possède un bouton "Primaire" bien visible en haut de sa sidebar (ex: Bouton "+" de Google Drive) pour les actions de création.

### 4.4 Concept de "Smart Data-List" (Inspiration Gmail/Workspace)
Pour la gestion des listes denses (élèves, admissions, documents), Feewi adopte une interface de type "Liste Intelligente" plutôt qu'un tableau classique rigide.

#### 4.4.1 Structure d'une Ligne (ListTile)
Chaque ligne est interactive et optimisée pour la lecture rapide :
*   **Leading :** Checkbox de sélection + Avatar de l'élève (ou placeholder circulaire).
*   **Primary Content :** Nom de l'élève en gras, suivi d'un aperçu des métadonnées (Classe, ID) en texte secondaire.
*   **Badges & Chips :** Affichage visuel des indicateurs (ex: "Paiement OK" en vert, "Dossier Incomplet" en rouge).
*   **Trailing :** Indicateur temporel (date d'inscription) ou statut final.
*   **Hover Actions :** Menu flottant apparaissant au survol pour les actions rapides (👁️ Voir, ✅ Valider, 🖨️ Imprimer).

#### 4.4.2 Navigation par Onglets (Workflow)
Utilisation d'onglets horizontaux en haut de liste pour segmenter les données selon leur état dans le processus métier :
*   **Exemple Admission :** `Tous` > `Soumis` > `Vérifiés` > `Validés`.
*   **UX :** Le passage d'un onglet à l'autre déclenche une transition fluide sans rechargement complet de la page (Signals + TanStack Query).

### 4.5 Concept de Vue Détail Fluide (Inspiration Gmail)
La consultation d'une fiche (élève, dossier d'admission) ne doit pas être une rupture dans le flux de travail. Elle suit le modèle de lecture "en série" de Gmail.

#### 4.5.1 Barre de Pilotage Supérieure
Chaque vue de détail possède une barre d'outils fixe permettant de traiter les dossiers "à la chaîne" :
*   **Navigation Séquentielle :** Boutons `<` et `>` en haut à droite pour passer instantanément à l'élément suivant/précédent de la liste filtrée (ex: "Dossier 5 sur 42").
*   **Actions Atomiques :** Icônes d'action rapide (Valider ✅, Rejeter ❌, Imprimer 🖨️, Archiver 📥) regroupées à gauche pour un accès direct.
*   **Retour Confortable :** Un bouton de retour simple pour revenir à la liste tout en conservant le filtre de recherche initial.

#### 4.5.2 Structure "Fil de Vie" (Body)
Le contenu est organisé de manière hiérarchique et visuelle :
*   **Titre & État :** Nom de l'élément en grand avec son statut actuel (ex: "Dossier n°123 - EN VÉRIFICATION").
*   **Sections Repliables :** Organisation par blocs logiques (État civil, Documents, Finances) permettant de masquer les données non pertinentes.
*   **Aperçu de Documents (Side-by-Side) :** Possibilité d'ouvrir une pièce jointe (PDF/Image) dans un panneau latéral tout en consultant les informations du formulaire (comparaison facile).

### 4.6 Standardisation Universelle des Données
Pour garantir une cohérence maximale et réduire le temps d'apprentissage des utilisateurs, le modèle **Smart Data-List** (Section 4.4) et la **Vue Détail Fluide** (Section 4.5) sont adoptés comme **Standards Obligatoires** pour toutes les entités du système :

*   **Module Admissions :** Candidatures, dossiers à vérifier, paiements initiaux.
*   **Module Scolarité (Registry) :** Liste des élèves actifs, archivés, diplômés.
*   **Module Structure Académique :** Liste des classes, niveaux, années scolaires.
*   **Module Identity (SaaS Admin) :** Liste des écoles (Tenants), utilisateurs, rôles.

#### Avantages de la Standardisation :
1.  **Réutilisabilité du Code :** Un seul composant Angular générique (BaseDataTableComponent) peut piloter toutes ces vues via une configuration de colonnes et d'actions.
2.  **Cohérence UX :** L'utilisateur retrouve les mêmes réflexes (recherche, filtres, actions au survol) partout dans l'écosystème.
3.  **Scalabilité :** L'ajout d'un nouveau module (ex: Finance ou Transport) se fait en quelques heures en réutilisant ces patterns.
