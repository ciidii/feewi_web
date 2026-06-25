# Référence API : Enrollment Service (Architecture Piliers & CMS)

Ce document définit le contrat final pour l'intégration du Frontend Angular avec le moteur d'admission dynamique de Feewi.

---

## 1. La Vision : "CMS Dynamique par Piliers"
Le formulaire d'admission n'est plus statique. Il est piloté par une configuration que l'école peut modifier.
*   **Piliers Système (🔒)** : Identité, Médical, Scolarité, Famille. (Inamovibles).
*   **Piliers Établissement (➕)** : N'importe quel nouveau bloc créé par l'école.

---

## 2. Guide d'Intégration Frontend (Angular)

### 2.1 Comment créer/modifier la structure (Admin)
L'école définit la structure globale via un seul point d'entrée atomique :
*   **Endpoint** : `PUT /enrollment/api/v1/admin/config`
*   **Action** : Pour ajouter un pilier, le Frontend ajoute une nouvelle clé dans l'objet `pillars`.
*   **Exemple** : Ajouter un pilier "Transport" avec un champ "Arrêt de bus".

### 2.2 Comment remplir les données (Parent)
Le Frontend doit utiliser les nouveaux endpoints dynamiques. Il ne faut plus utiliser `/candidate` ou `/guardians`.

| Cible | Endpoint | Usage |
| :--- | :--- | :--- |
| **Enfant** | `PATCH /admissions/{id}/pillars/{pillarKey}` | Met à jour un onglet spécifique de l'enfant (ex: `pillar_identity`). |
| **Famille** | `PATCH /admissions/bundles/{id}/pillars/pillar_family` | Met à jour les infos parents partagées par la fratrie. |

---

## 3. Workflow de Soumission (Step-by-Step)

1.  **ÉTAPE 1 : Initialisation**
    *   `POST /admissions` -> Crée le **Bundle** (Fratrie) et les dossiers enfants en statut `DRAFT`.
    *   *Astuce* : Envoyer `"academicYearId": "current"` et `"levelId": "TEMP"` pour la première étape rapide.

2.  **ÉTAPE 2 : Remplissage des Piliers**
    *   Appels successifs à `PATCH /pillars/{key}` au fur et à mesure que le parent valide ses onglets.

3.  **ÉTAPE 3 : Documents**
    *   `POST /admissions/{id}/documents/{docCode}` pour chaque pièce scannée.

4.  **ÉTAPE 4 : Validation Finale**
    *   `POST /admissions/{id}/submit` -> Le dossier passe en `SUBMITTED`.

---

## 4. Gestion des Notes et Évaluations (Dashboard Admin)

*   **Endpoint** : `PATCH /admissions/{id}/assessment`
*   **Calcul Automatique** : Le Backend calcule la moyenne pondérée selon les coefficients du pilier `subjects`.
*   **Barèmes** : Toujours vérifier le champ `maxGrade` (10, 20 ou 100) pour valider la saisie utilisateur.

---

## 5. Lexique des Piliers Système
*   `pillar_identity` : Nom, Prénom, Sexe, Naissance.
*   `pillar_medical` : Groupe sanguin, Allergies.
*   `pillar_family` : Parents, Adresse, Responsable Financier.
*   `pillar_schooling` : Année cible, Niveau, École de provenance.

---
*Fin de documentation - Architecture Feewi v2.0 - Avril 2026*
