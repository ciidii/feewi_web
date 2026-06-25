# Spécifications Fonctionnelles : Enrollment Service (Gestion des Admissions)

## 1. Introduction
Le service **Enrollment** est le microservice **opérationnel** de Feewi chargé de gérer le flux d'entrée des élèves dans l'établissement. Il orchestre le cycle de vie d'une demande d'admission, de la saisie initiale (par le parent ou le secrétariat) jusqu'à la décision finale de la Direction.

---

## 2. Concepts Clés & Multi-tenancy
- **Tenant Isolation** : Chaque dossier d'admission est strictement lié à un `tenant_id`. Un administrateur de l'école A ne peut jamais voir les demandes de l'école B.
- **Stratégie Multi-canal (Hybride)** :
    - **Canal Digital** : Le parent saisit le dossier en autonomie via le portail public de l'école.
    - **Canal Direct (Voie Physique)** : Le secrétariat saisit les informations pour le compte du parent lors d'un dépôt physique.
- **Soft-Enrollment (Réinscription)** : Processus simplifié pour les élèves déjà présents dans l'école (`Student Registry`). Le formulaire est pré-rempli, seules les mises à jour et la validation financière sont requises.
- **Workflow-Centric** : Le service ne crée pas d'élèves directement dans le référentiel (`Student Registry`) ; il gère une **demande** qui, une fois validée, déclenche la création de l'élève par événement.
- **Période d'Admission** : Les demandes sont rattachées à une `AcademicYear` spécifique (gérée par le service Academic).

---

## 3. Workflow d'Admission (Machine à États)

Une demande d'admission (`Application`) traverse les états suivants :

| État | Acteur | Description |
| :--- | :--- | :--- |
| **`DRAFT`** | Parent / Secrétaire | Saisie en cours. Le dossier n'est pas encore visible pour traitement. |
| **`SUBMITTED`** | Parent / Secrétaire | Dossier soumis. En attente de vérification administrative. (Passage immédiat possible en Voie Directe). |
| **`VERIFIED`** | Secrétaire | Pièces jointes conformes (ou reçues physiquement). Le candidat est autorisé à passer le test. |
| **`TESTING`** | Enseignant / Jury | Phase d'évaluation (Test de niveau). Saisie des notes et de l'avis. |
| **`WAITLIST`** | Direction / Système | Candidat admis pédagogiquement mais classe complète (Quotas atteints). |
| **`VALIDATED`** | Direction | Admission définitive. Prêt pour création du matricule (après paiement). |
| **`REJECTED`** | Direction | Admission refusée (motif administratif ou pédagogique). |
| **`CANCELLED`** | Parent / Secrétaire | Dossier annulé par le demandeur. |

### Règles de Transition :
- On ne peut passer à `VERIFIED` que si toutes les pièces obligatoires sont présentes (physiquement ou numériquement).
- **Verrou de Validation Numérique** : Un dossier ne peut être **`VALIDATED`** que si 100% des documents marqués `MANDATORY` ont été numérisés (état `UPLOADED`). Le statut `PHYSICAL_RECEIVED` est bloquant pour l'admission finale.
- Le passage à `TESTING` est optionnel (configuré par l'école).
- Un dossier en `WAITLIST` peut être `VALIDATED` dès qu'une place se libère (sous réserve du verrou numérique).
- Un dossier `VALIDATED` ou `REJECTED` est considéré comme **final** (lecture seule).

---

## 4. Modèle de Données Fonctionnel (`Application`)

Chaque demande d'admission regroupe quatre blocs d'informations :

### 4.1 Informations Candidat (Élève potentiel)
- État civil (Nom, Prénoms, Sexe, Date de naissance, Lieu de naissance).
- Nationalité.
- École de provenance (si applicable).
- Niveau demandé (ID du `EducationalLevel` issu du service Academic).
- Classe souhaitée (Optionnel).

### 4.2 Informations Responsables (Parents/Tuteurs)
- Responsable Principal (Nom, Prénoms, Téléphone, Email, Profession, Lien de parenté).
- Second Responsable (Optionnel).
- Adresse de résidence de la famille.

### 4.3 Évaluation Pédagogique (`Assessment`)
- **Notes du Test** : Français, Mathématiques, Éveil (personnalisable).
- **Avis de l'Examinateur** : Commentaire libre sur le profil de l'enfant.
- **Décision Pédagogique** : `ADMIS`, `ADMIS_SOUS_RESERVE`, `REFUSE`.
- **Niveau Recommandé** : Peut différer du niveau demandé suite au test (ex: demande CM2 mais orienté CM1).

### 4.4 Pièces Jointes & Checklist (`RequiredDocuments`)
La liste des documents demandés est dynamique et configurée par l'établissement :
- **Documents Standards** : Extrait de naissance, Bulletins de notes, Photos d'identité, Certificat de scolarité.
- **Documents Spécifiques** : Certificat médical, Attestation de réussite, Justificatif de domicile.
- **Statut par document** : Chaque document dans la checklist est marqué comme `MANDATORY` (bloquant pour la vérification) ou `OPTIONAL`.
- **Mode de Réception** : Indique si le document a été chargé en ligne (`UPLOADED`) ou remis en main propre au secrétariat (`PHYSICAL_RECEIVED`).

### 4.5 Options & Services Souscrits (`ServiceSubscriptions`)
- Liste des services périscolaires choisis par le parent lors de l'inscription :
    - **Restauration** (Cantine, Demi-pension).
    - **Transport Scolaire** (Zone de ramassage, trajet Aller/Retour).
    - **Activités Extra-scolaires** (Sport, Arts, Soutien).
    - **Assurances & Packs** (Assurance scolaire, pack fournitures).

### 4.6 Schéma Dynamique du Formulaire (`FormSchema`)
Le formulaire d'admission n'est pas figé. Il est généré selon une configuration par établissement :
- **Core Fields (Obligatoires)** : Nom, Prénom, Date de naissance, Sexe, Téléphone Parent.
- **Library Fields (Activables)** : Liste de champs pré-définis (Nationalité, Religion, Groupe Sanguin, École de provenance).
- **Custom Fields (Spécifiques)** : Champs créés par l'école (Type : Texte, Nombre, Date, Liste déroulante) stockés en format JSONB.

---

## 5. Fonctionnalités Stratégiques (Réf. ARCHITECTURE.md)

### F6 : Enregistrement Multi-canal (Hybride)
- **Portail Public Dynamique** : Le formulaire s'adaptent automatiquement à la configuration de l'école.
- **Saisie Secrétariat (Fast Entry)** : Interface optimisée pour le dépôt physique.
- **Numérisation Différée** : Le secrétariat peut marquer les pièces comme reçues (`PHYSICAL_RECEIVED`) pour libérer le parent. Le système place alors le dossier dans une file d'attente "À Numériser" pour un upload ultérieur.

---

### F13 : Configuration du Portail & Formulaire (Self-Service)
- **Gestion du Catalogue de Services** : Activation/Désactivation des offres (Cantine, Transport).
- **Configuration du Formulaire d'Admission** :
    - Sélection des champs de la "Bibliothèque" à afficher.
    - Création de champs personnalisés (Custom Fields).
- **Configuration de la Checklist Documentaire** :
    - Définition de la liste des pièces à fournir (Standards + Spécifiques).
    - Paramétrage du caractère obligatoire ou facultatif par document.

### F7 : Vérification & Testing (Compliance)
- **Vérification Administrative** : Visualisation côte-à-côte des informations et documents.
- **Module de Test** : Interface pour les enseignants permettant de saisir les résultats des tests de niveau. Génération d'un "Bon de Test" imprimable pour le candidat.

### F14 : Récépissé & Décharge de Dépôt
- **Génération de Récépissé** : Production automatique d'un document PDF attestant du dépôt du dossier physique.
- **Inventaire des Pièces** : Liste clairement les documents fournis et ceux restant à compléter.
- **Convocation de Test** : Si le dossier est `VERIFIED` immédiatement, le récépissé inclut la date et l'heure du test de niveau.

### F12 : Gestion des Quotas & Liste d'Attente
- **Contrôle de Capacité** : Le système interroge le service `Academic Structure` pour connaître la capacité restante (Quota) du niveau/classe.
- **Passage Automatique en Waitlist** : Si le quota est atteint lors de la validation, le dossier bascule en `WAITLIST` au lieu de `VALIDATED`.
- **Priorisation** : Gestion de l'ordre de la liste d'attente (date de dépôt, fratrie, notes du test).

### F1 : Validation Décisionnelle (Direction)
- Tableau de bord synthétique pour la Direction.
- **Contrôle de Compliance Numérique** : Un indicateur visuel (Scan Check) signale si toutes les pièces obligatoires sont numérisées. Le bouton "Valider l'Admission" est désactivé si le verrou numérique est actif.
- Validation individuelle ou par lots (Bulk validation).
- Arbitrage des dossiers en liste d'attente.

### F11 : Workflow Tracker
- Suivi visuel de l'avancement (Barre de progression : Saisie -> Vérification -> Test -> Décision).
- Notifications automatiques (par email/SMS si configuré) lors des changements d'état majeurs.

### F15 : Real-Time Parent Tracker (L'effet Uber)
- **Timeline Interactive** : Le parent dispose d'une vue en temps réel sur l'avancement de son dossier via le portail public.
- **Transparence** : Affichage des étapes claires (`Dossier Reçu`, `Vérification en cours`, `Convoqué au Test`, `En attente de délibération`).
- **Réduction du Bruit** : Diminue les sollicitations téléphoniques du secrétariat.

### F16 : Campagnes de Réinscription (Soft-Enrollment)
- **Génération en Lot** : L'école peut lancer une campagne pour une classe ou tout l'établissement, envoyant des liens personnalisés aux parents.
- **Pré-remplissage Intelligent** : Les données existantes du `Student Registry` sont injectées dans le formulaire.
- **Dashboard de Rétention** : Statistiques en temps réel sur le taux de réinscription pour la rentrée suivante.

---

## 6. Communication Événementielle (RabbitMQ)

Le service **Enrollment** publie des messages sur l'échange `feewi.enrollment.events` :

1. **`ADMISSION_SUBMITTED`** : Notifier le secrétariat d'une nouvelle demande.
2. **`ADMISSION_VERIFIED`** : Notifier les enseignants qu'un candidat est prêt pour le test.
3. **`ADMISSION_VALIDATED`** : Événement majeur contenant le payload complet du dossier (Candidat + Responsables + Résultats Test).
    - *Consommateurs* :
        - `Student Registry` -> Crée l'entité `Student`.
        - `Academic Structure` -> Ajoute l'élève à la liste d'affectation des classes.
4. **`ADMISSION_REJECTED`** : Permet éventuellement d'archiver la demande.

---

## 7. Sécurité & Permissions

Les permissions sont granulaires et liées au `tenant_id` :

| Permission | Rôle Typique | Description |
| :--- | :--- | :--- |
| `admission:create` | PARENT, SECRETARY | Créer et soumettre un dossier. |
| `admission:verify` | SECRETARY | Vérifier la conformité des pièces. |
| `admission:validate` | DIRECTION | Valider ou Rejeter définitivement. |
| `admission:read` | TOUS (Interne) | Consulter les dossiers de l'école. |

---

## 8. UX : Standards "Smart Data-List" & "Détail Fluide"

Conformément à `FRONTEND_SPEC.md`, l'interface Enrollment doit proposer :
- **Vue Liste** : Filtrage par État (Onglets : `À Vérifier`, `À Valider`, `Traités`).
- **Vue Détail** : Navigation séquentielle (Suivant/Précédent) pour traiter les dossiers à la chaîne sans revenir à la liste.
- **Side-by-Side** : Visionneuse de document intégrée pour éviter de télécharger chaque fichier localement.

---
*Spécifications validées par l'Architecte - Mars 2026*
