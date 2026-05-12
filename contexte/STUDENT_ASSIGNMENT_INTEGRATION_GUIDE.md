# Guide d'Intégration : Affectation des Élèves aux Classes (Student Assignment)

Ce document détaille le fonctionnement de la file d'attente d'affectation et le processus de placement des élèves dans les classes physiques au sein du module Académique.

---

## 1. Vision et Workflow
L'affectation est le maillon final qui transforme un "Candidat Admis" en un "Élève en Classe". Pour garantir la souplesse, le système utilise une architecture en deux temps :

1.  **Placement en File d'Attente (Automatique)** : Dès qu'une admission est validée dans le module Enrollment, l'élève est automatiquement ajouté à la liste des élèves "À affecter" pour l'année et le niveau concernés.
2.  **Affectation Physique (Manuel/Direction)** : Le secrétariat choisit la classe finale (ex: 6ème A) parmi les classes disponibles, sous réserve de place.

---

## 2. Intégration Événementielle (RabbitMQ)
Le module Académique écoute l'événement suivant pour alimenter sa file d'attente :

*   **Événement :** `ADMISSION_VALIDATED`
*   **Source :** `enrollment-service`
*   **Action :** Création d'une entrée dans `student_assignments` au statut `WAITING`.
*   **Déduplication :** Le système vérifie l'unicité `(studentId, academicYearId)` pour éviter les doublons.

---

## 3. Référence API (`/api/v1/academic/assignments`)

### 3.1 Lister les élèves en attente
Retourne la liste des élèves admis n'ayant pas encore de classe.
*   **URL :** `GET /waiting?yearId={UUID}&levelId={UUID}`
*   **Usage :** Alimenter le "bac à sable" ou la liste de gauche dans une interface de Drag & Drop.

### 3.2 Assigner un élève à une classe
Place un élève dans une classe spécifique.
*   **URL :** `POST /{assignmentId}/assign?classId={UUID}`
*   **Règles Métier (Validations) :**
    *   **Isolation** : L'élève et la classe doivent appartenir au même Tenant.
    *   **Cohérence** : La classe doit correspondre au niveau (Level) et à l'année scolaire de l'élève.
    *   **Capacité** : L'affectation échoue (`409 Conflict`) si la capacité maximale de la classe est atteinte.

### 3.3 Désassigner un élève
Retire l'élève de sa classe et le remet en file d'attente.
*   **URL :** `POST /{assignmentId}/unassign`

### 3.4 Voir les élèves d'une classe
*   **URL :** `GET /class/{classId}`

---

## 4. Modèle de Données (`StudentAssignment`)

| Champ | Type | Description |
| :--- | :--- | :--- |
| `studentId` | UUID | Pivot vers le Registre des Élèves. |
| `studentFirstName`| String | Prénom de l'élève (Dénormalisé pour affichage). |
| `studentLastName` | String | Nom de l'élève (Dénormalisé pour affichage). |
| `studentGender` | String | Sexe de l'élève (MALE/FEMALE). |
| `status` | Enum | `WAITING` (En attente), `ASSIGNED` (Affecté). |
| `schoolClassId` | UUID | ID de la classe finale (null si WAITING). |
| `assignedAt` | Timestamp | Date et heure du placement en classe. |

---

## 5. Guide UI (Angular)
Pour une expérience utilisateur optimale, il est recommandé d'implémenter un écran de type **Tableau de Répartition** :
1.  **Colonne Gauche** : Liste des élèves `WAITING` pour un niveau donné.
2.  **Zone Droite** : Cartes représentant les classes (`SchoolClass`) avec leur jauge de remplissage (`count / capacity`).
3.  **Action** : Glisser l'élève vers une classe appelle l'endpoint `/assign`.

---
*Validé par l'Architecture Feewi - Mai 2026*
