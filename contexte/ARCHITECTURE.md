# Feewi : Système de Gestion Scolaire SaaS (SaaS)

**Feewi** (du Pulaar *"C'est en ordre"*) est une solution SaaS de gestion administrative scolaire conçue pour moderniser et structurer les établissements privés.

## 1. Vision Globale
L'objectif est de concevoir une solution **SaaS** (Software as a Service) basée sur une architecture de **microservices distribués**, permettant une isolation stricte des données (Multi-tenancy) et une haute disponibilité.

## 2. Choix Architecturaux Fondamentaux

### 2.1 Style Architectural : Microservices
- **Justification :** Répondre à la complexité des processus métier identifiés (Admission, Dossiers, Affectation, Documents). Permet une évolution indépendante de chaque brique fonctionnelle.
- **Isolation :** Chaque microservice possède sa propre base de données (Database per Service) pour garantir l'autonomie.

### 2.2 Stratégie Multi-Tenant (SaaS)
- **Modèle :** Base de données partagée avec isolation logique par `tenant_id` (Identifiant de l'école).
- **Sécurité :** Mise en œuvre du Row Level Security (RLS) pour garantir l'étanchéité des données entre établissements.

### 2.3 Communication Inter-Services (Message Broker)
- **Pivot Central :** Utilisation de **RabbitMQ** comme intermédiaire de communication.
- **Modèle Événementiel (Event-Driven) :** Les services ne s'appellent pas directement (découplage total). Ils publient des événements (ex: `ADMISSION_VALIDATED`) et réagissent aux messages reçus.
- **Réplication de Données :** Pour éviter les appels "Query" entre services, chaque microservice maintient un cache local des données nécessaires (ex: `Document Engine` stocke une copie locale minimale des élèves via les événements de synchronisation).

### 2.4 Stratégie de Données à Trois Couches
Pour garantir l'intégrité, la performance et la fiabilité (standard MDM - Master Data Management), le système sépare les responsabilités de données :
- **Données Référentielles (Le "Savoir") :** Sources de vérité stables et uniques. Gérées par les services Registry. (ex: Identité de l'élève, structure des classes).
- **Données Opérationnelles (Le "Faire") :** Données liées aux processus métiers et aux workflows transactionnels. Gérées par les services de mouvement. (ex: Workflow d'inscription, validation de dossier).
- **Données d'Édition (La "Sortie") :** Données dénormalisées, pré-fusionnées et optimisées pour l'affichage rapide et l'impression (PDF). Gérées par le moteur de documents.

### 2.5 Contrôle d'Accès Basé sur les Rôles (RBAC)
Pour une flexibilité maximale et une sécurité accrue (SaaS multi-tenant) :
- **Centralisation :** L'authentification et l'autorisation sont gérées au niveau de l'**API Gateway** via des tokens **JWT**.
- **Granularité :** Le système utilise des **Permissions** (ex: `admission:validate`) rattachées à des **Rôles** (Direction, Secrétariat).
- **Multi-tenancy :** Chaque permission est strictement filtrée par le `tenant_id` contenu dans le JWT, garantissant qu'un utilisateur n'accède qu'aux données de son établissement.

## 3. Découpage en Microservices (Scope Administratif)

| Microservice | Type de Donnée | Responsabilité Métier | Fonctionnalités (Réf 1.2.3) |
| :--- | :--- | :--- | :--- |
| **API Gateway** | - | Point d'entrée unique, Routage. | Sécurité globale |
| **Identity Service** | **Référentielle** | Gestion des Écoles (SaaS), Authentification, RBAC (JWT). | Sécurité & Multi-tenancy |
| **Enrollment Service** | **Opérationnelle** | Gestion du workflow d'entrée : demandes, vérification, validation. | F1, F6, F7 |
| **Student Registry** | **Référentielle** | Référentiel central de l'élève. Cycle de vie et archivage. | F2, F8 |
| **Academic Structure** | **Référentielle** | Structure de l'école (Classes, Niveaux) et affectation. | F3, F9 |
| **Document Engine** | **Édition** | Génération asynchrone de documents PDF (templates). | F4, F10 |

## 4. Flux de Travail Événementiel (Exemple : Admission)

1. **Secrétariat (Enrollment Service) :** Saisie de la demande -> Publication de `INSCRIPTION_SUBMITTED`.
2. **Direction (Enrollment Service) :** Validation -> Mise à jour du statut -> Publication de `ADMISSION_VALIDATED`.
3. **Registry Service :** Écoute `ADMISSION_VALIDATED` -> Création automatique du dossier élève.
4. **Academic Service :** Écoute `ADMISSION_VALIDATED` -> Ajout de l'élève dans la liste "À affecter".

## 5. Pile Technique (Stack)
- **Frontend :** React (TypeScript) + Tailwind CSS.
- **Backend :** Node.js (NestJS) pour sa structure modulaire native.
- **Base de données :** PostgreSQL (Gestion relationnelle des données scolaires).
- **Messaging :** RabbitMQ.
- **Conteneurisation :** Docker & Docker Compose pour l'orchestration locale des services.

## 6. Synthèse des Acteurs et Rôles
- **Direction :** Rôle de validation, supervision et décision finale.
- **Secrétariat :** Rôle opérationnel de saisie, vérification et production documentaire.
- **Parent (Portail Public) :** Rôle de demandeur (Saisie des informations d'admission en ligne et dépôt des pièces).

## 7. Détail Fonctionnel par Microservice

### 7.1 Identity Service (Fondation SaaS)
- **Gestion des Écoles :** Enregistrement et configuration des tenants (`tenant_id`).
- **Authentification :** Login/Logout, gestion sécurisée des mots de passe.
- **Moteur RBAC :** Gestion des rôles (Direction, Secrétariat, Parent) et des permissions granulaires.
- **JWT Issuer :** Génération de tokens signés incluant le `tenant_id` et les permissions.

### 7.2 Enrollment Service (Opérationnel)
- **Portail Admission en Ligne :** Interface permettant aux parents de soumettre leur dossier à distance.
- **F6 : Enregistrement & Réception :** Validation et correction des demandes soumises en ligne ou saisie manuelle pour les dossiers physiques.
- **F7 : Vérification :** Contrôle de la complétude et conformité des dossiers via un workflow d'états.
- **F1 : Validation :** Interface décisionnelle pour la Direction (Approbation/Rejet).
- **F11 : Workflow Tracker :** Suivi en temps réel de l'état d'avancement pour le secrétariat et les parents.

### 7.3 Student Registry Service (Référentiel Élèves)
- **F8 : Gestion du Cycle de Vie :** Création automatique (via Event), mise à jour et archivage.
- **Flexibilité du Dossier Scolaire :** Architecture hybride permettant la personnalisation par établissement :
    - **Socle Commun (Core Fields) :** Données obligatoires stockées en colonnes relationnelles (Nom, Prénom, Matricule, etc.).
    - **Champs Personnalisés (Custom Fields) :** Utilisation du format **JSONB** de PostgreSQL pour permettre à chaque école de définir ses propres champs spécifiques (ex: Groupe sanguin, allergies, école de provenance) sans modification du schéma.
- **F2 : Consultation :** Accès rapide et sécurisé aux informations administratives des élèves.
- **Audit Log :** Traçabilité complète des modifications sur les données référentielles.

### 7.4 Academic Structure Service (Référentiel Structure)
- **Gestion de la Temporalité :** Définition et configuration des **Années Scolaires** (ex: 2024-2025) avec gestion de l'état (Année courante, Année en préparation, Archives).
- **Configuration Scolaire :** Définition des niveaux, cycles et classes rattachés dynamiquement à une année scolaire donnée.
- **Moteur de Bascule (Roll-over) :** Processus automatisé de passage au niveau supérieur et de changement d'année de référence pour l'établissement.
- **F9 : Affectation :** Répartition des élèves inscrits dans les classes respectives pour l'année scolaire active.
- **F3 : Supervision :** Visualisation des effectifs et équilibrage des classes par la Direction.

### 7.5 Document Engine Service (Édition)
- **Moteur de Templates (Handlebars/EJS) :** Système de modèles HTML/CSS personnalisables par établissement (Logo, En-tête, Pied de page, Signature).
- **F10 : Production Documentaire :**
    - **Documents Internes :** Listes de classes, listes d'émargement, fiches de renseignements.
    - **Documents Officiels :** Certificats de scolarité, attestations d'inscription (engagent la responsabilité de l'établissement).
- **F4 : Workflow de Validation :** Cycle de vie des documents officiels (Brouillon -> Validé par Direction -> Délivré).
- **Génération Asynchrone :** Utilisation de workers pour la production de PDF lourds sans bloquer l'interface utilisateur.
