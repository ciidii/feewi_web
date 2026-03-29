# Stratégie de Gouvernance : Portail Public d'Admission

## 1. Vision
L'objectif est d'offrir à chaque établissement un contrôle total (100%) sur son expérience d'admission en ligne, sans intervention technique. Le système doit passer d'un mode "statique" à un mode "piloté par la configuration" (Configuration-Driven).

---

## 2. Les 4 Piliers du Contrôle Établissement

### 2.1 Pilier Temporel (Disponibilité)
Le contrôle du temps permet de gérer la charge de travail administrative et le flux de parents.
*   **Fenêtres d'Admission** : Synchronisation avec le service *Academic* pour respecter les dates `registrationStartDate` et `registrationEndDate`.
*   **Master Switch (Interrupteur d'urgence)** : Possibilité pour la direction de fermer le portail en un clic, indépendamment des dates prévues.
*   **Mode "Tracking Only"** : Permet de bloquer les nouvelles demandes tout en laissant les parents suivre l'avancement des dossiers existants.

### 2.2 Pilier Fonctionnel (Le Formulaire Dynamique)
Chaque école possède ses propres critères de sélection. Pour concilier standardisation et hyper-personnalisation, le formulaire suit la **Théorie des 3 Cercles** (Noyau, Socle, Libres).

**Granularité par Niveau & Cycle (NOUVEAU) :**
Le portail adapte automatiquement ses exigences en fonction du niveau scolaire visé :
*   **Checklists Différenciées** : Les pièces justificatives varient selon l'âge (ex: Carnet de vaccination obligatoire pour la Petite Section, Relevés de notes officiels pour la Terminale).
*   **Formulaires Adaptatifs** : Les questions personnalisées peuvent être ciblées (ex: "L'enfant est-il propre ?" uniquement pour le cycle Préscolaire).
*   **Héritage Intelligent** : Les niveaux héritent d'une configuration par défaut du Tenant, sauf si un "Override" spécifique est défini pour le niveau ou le cycle.

**Scénarisation du Parcours :**
Le formulaire n'est pas une liste plate, mais un parcours guidé :
*   **Découpage par Sections** : Organisation logique des champs par thématiques (Identité, Famille, Santé, Documents).
*   **Champs d'Information (Read-only)** : Possibilité d'insérer des blocs de texte, des conseils ou des rappels de règles à l'intérieur du formulaire pour guider le parent.
*   **Aide Contextuelle** : Chaque champ de saisie peut être accompagné d'un message d'aide (Tooltip) expliquant pourquoi ou comment saisir la donnée.

### 2.3 Pilier Opérationnel (Contrôle des Flux & Quotas)
Éviter la saturation et gérer la liste d'attente de manière transparente.
*   **Vérification de Capacité en Temps Réel** : Lien avec le service *Academic* pour connaître le nombre de places restantes par classe.
*   **Seuils d'Alerte** : Affichage d'un avertissement "Places limitées" ou "Dossier sur liste d'attente" lorsque 90% de la capacité est atteinte.
*   **Fermeture par Niveau** : Possibilité de fermer les inscriptions pour un niveau spécifique (ex: la 6ème est pleine) tout en laissant les autres ouverts.

### 2.4 Pilier Identitaire (Branding & Communication)
Le portail public est la vitrine de l'école.
*   **White-labeling de base** : Injection automatique du logo, des couleurs et du slogan de l'école (via le service *Identity*).
*   **Emails Personnalisés** : Customisation des messages de bienvenue et de confirmation envoyés aux parents via le *Document Engine*.

### 2.5 Pilier Analytique & Conversion (NOUVEAU)
Transformer le portail en outil de performance commerciale.
*   **Tunnel de Conversion** : Suivi statistique des étapes (Combien de visiteurs -> Créations -> Documents chargés -> Soumissions).
*   **Analyse des Abandons** : Identification des points de friction (ex: un champ personnalisé trop complexe qui fait fuir les parents).
*   **Lead Recovery** : Relance automatique ou manuelle des dossiers restés en statut `DRAFT` (Récupération des prospects).

### 2.6 Pilier Gouvernance & Conformité (NOUVEAU)
Garantir la sécurité juridique et la qualité des données.
*   **Validation de Données Assistée** : Utilisation de masques de saisie et de contrôles de cohérence (ex: pas de date de naissance dans le futur).
*   **Acceptation des CGU/Règlement Intérieur** : Obliger le parent à cocher la lecture du règlement spécifique à l'école avant soumission.
*   **Gestion du Consentement (RGPD/APDP)** : Tracer l'accord du parent pour l'utilisation des données de l'enfant.

---

## 3. Matrice de Responsabilité Technique

| Fonctionnalité | Microservice Responsable | Source de Donnée |
| :--- | :--- | :--- |
| Dates d'ouverture | Academic Service | `AcademicYear` |
| Quotas & Capacité | Academic Service | `SchoolClass` |
| Champs du formulaire | Enrollment Service | `EnrollmentConfig.formSchema` |
| Pièces justificatives | Enrollment Service | `EnrollmentConfig.documentChecklist` |
| Logos & Couleurs | Identity Service | `SchoolProfile` |
| Messages & Emails | Document Engine | `Template` |
| Tracking & Analytics | Enrollment Service | `ApplicationAudit` |

---

## 4. Prochaines Évolutions Prioritaires (Architecte)
1.  **Refactor de `EnrollmentConfig`** : Ajouter le `Master Switch`, les `Instructions UX` par étape, et les `LegalTexts`.
2.  **Moteur de Validation JSONB** : Valider les réponses des parents par rapport au schéma défini par l'école.
3.  **Lien Quotas Temps-Réel** : Connecter Academic pour bloquer automatiquement les niveaux complets.
4.  **Dashboard de Conversion** : Créer l'endpoint statistique pour la Direction.

---
*Validé par l'Architecture Feewi - Mars 2026*
