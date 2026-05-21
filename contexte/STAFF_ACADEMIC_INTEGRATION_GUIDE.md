# Guide d'Intégration : Personnel (Staff) & Enseignements

Ce document explique comment intégrer les nouveaux flux de gestion du personnel et d'affectation des enseignants dans le Frontend.

## 1. Concept Clé : Séparation Staff vs User

*   **Staff (Personnel)** : L'identité physique de l'employé (Nom, Prénom, Type). C'est la base de données RH.
*   **User (Compte)** : Les identifiants de connexion liés à un membre du personnel.

**Règle d'or** : On peut avoir un membre du personnel (ex: un Enseignant) sans qu'il ait de compte utilisateur.

---

## 2. Gestion du Personnel (Identity Service)

### Lister le personnel
Pour afficher l'organigramme ou la liste RH :
*   **Endpoint** : `GET /api/v1/staffs`
*   **Filtrage par type** : `GET /api/v1/staffs?type=TEACHER` (Idéal pour les listes déroulantes de choix de profs).

### Créer un membre du personnel
*   **Endpoint** : `POST /api/v1/staffs`
*   **Payload** :
    ```json
    {
      "firstName": "Moussa",
      "lastName": "Diop",
      "email": "m.diop@ecole.sn",
      "phone": "771234567",
      "staffType": "TEACHER", // ou ADMINISTRATION, SUPPORT, OTHER
      "matricule": "MAT-2026-001"
    }
    ```

### Créer un compte utilisateur (Accès système)
Une fois le personnel créé, vous pouvez lui ouvrir un accès :
*   **Endpoint** : `POST /api/v1/users`
*   **Payload** :
    ```json
    {
      "email": "m.diop@ecole.sn",
      "password": "...",
      "staffId": "UUID_DU_STAFF", // Obligatoire
      "userTypeCode": "TEACHER",
      "roles": ["Enseignant"]
    }
    ```

---

## 3. Affectation des Enseignants (Academic Service)

Le module académique utilise désormais le `staffId` pour lier les professeurs aux matières.

### Affecter un prof à une classe
*   **Endpoint** : `POST /api/v1/academic/classes/{classId}/teachings`
*   **Payload** :
    ```json
    {
      "subjectId": "UUID_MATIERE",
      "teacherId": "UUID_DU_STAFF", // Doit être de type TEACHER
      "coefficient": 2,
      "maxScore": 20
    }
    ```

### Validation et Erreurs
Le Backend rejette désormais l'assignation si :
1.  Le `teacherId` n'existe pas.
2.  Le personnel n'est pas de type `TEACHER` (ex: tentative d'affecter un agent de sécurité à un cours de Maths).
*   **Erreur renvoyée** : `400 Bad Request` avec le message *"L'utilisateur sélectionné n'est pas un membre du personnel enseignant."*

---

## 4. Impact sur l'Interface Utilisateur (UX)

1.  **Saisie des Enseignants** : Dans l'écran de configuration des classes, utilisez l'API `GET /api/v1/staffs?type=TEACHER` pour remplir les listes déroulantes.
2.  **Profil Complet** : Pour afficher le nom/prénom d'un utilisateur connecté, utilisez le champ `staff` dans la réponse de `GET /api/v1/users/me`.
    *   *Ancien format* : `user.firstName`
    *   *Nouveau format* : `user.staff.firstName`

---

## 5. Catalogue des Types de Personnel (`staffType`)
*   `TEACHER` : Pour tous les enseignants.
*   `ADMINISTRATION` : Direction, Secrétariat, Comptabilité.
*   `SUPPORT` : Gardiens, Chauffeurs, Maintenance.
*   `OTHER` : Divers.
