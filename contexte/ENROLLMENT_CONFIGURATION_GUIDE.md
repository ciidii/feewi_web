# Documentation de la Configuration des Inscriptions (Enrollment)

Ce document détaille le fonctionnement de la configuration du service d'admission de Feewi. Il explique comment les établissements peuvent personnaliser leur portail, leurs piliers de données et leurs règles de gestion.

---

## 1. Architecture de la Configuration
La configuration est séparée en deux couches distinctes pour optimiser la performance et la clarté :

1.  **EnrollmentSchema (Le "Moule")** : Définit la structure des données (quels piliers sont actifs, quels champs sont présents, types de données). Change rarement.
2.  **EnrollmentConfig (L'Opérationnel)** : Définit l'état courant du portail (ouvert/fermé, quotas par niveau, textes d'accueil, overrides par année scolaire). Change fréquemment.

---

## 2. Gestion des Piliers
Un dossier d'admission est composé de "Piliers". Chaque pilier peut être configuré différemment.

| Nom du Pilier | Type | Désactivable ? | Description |
| :--- | :--- | :--- | :--- |
| **Identity** | Core | ❌ Non | État civil de l'enfant. |
| **Schooling** | Core | ❌ Non | Niveau demandé et année scolaire. |
| **Family** | Preset | ✅ Oui | Informations sur les parents/tuteurs. |
| **Medical** | Preset | ✅ Oui | Allergies, groupe sanguin, contacts d'urgence. |
| **Documents** | Preset | ✅ Oui | Pièces jointes numérisées. |
| **Services** | Preset | ✅ Oui | Cantine, transport, etc. |
| **Assessment** | Preset | ✅ Oui | Notes et décisions pédagogiques. |
| **ExtraPillars** | Custom | ✅ Oui | Piliers créés de toutes pièces par l'école. |

### Actions sur les Piliers :
*   **Activer/Désactiver** : Via le champ `enabled` dans la config du pilier (uniquement pour les types Preset/Custom).
*   **Renommer** : Possible pour tous les piliers via l'interface d'administration.

---

## 3. Personnalisation des Champs (Fields)
Chaque pilier contient des champs qui peuvent être de trois types : **Core**, **Preset** ou **Custom**.

### Types de Données Supportés (`FieldType`) :
*   `TEXT` : Texte court.
*   `TEXTAREA` : Texte long.
*   `NUMBER` : Valeur numérique.
*   `DATE` : Sélecteur de date.
*   `BOOLEAN` : Case à cocher (Vrai/Faux).
*   `SELECT` : Liste déroulante avec options personnalisées.

### Actions sur les Champs :

| Action | Champs CORE (ex: Prénom) | Champs PRESET/CUSTOM |
| :--- | :--- | :--- |
| **Modifier le libellé** | ✅ Oui (via `CoreFieldControl`) | ✅ Oui |
| **Modifier le type** | ❌ Non | ✅ Oui |
| **Rendre obligatoire** | ❌ Non (Fixe) | ✅ Oui |
| **Masquer (Hidden)** | ❌ Non (Fixe) | ✅ Oui |
| **Supprimer** | ❌ Non | ✅ Oui |

---

## 4. Gestion des Documents
L'école peut exiger des pièces jointes spécifiques.

*   **Presets Feewi** : `BIRTH_CERT` (Extrait), `PHOTO`, `REPORT_CARD` (Bulletin), `VACCINE_CARD`.
*   **Documents Custom** : L'école peut ajouter n'importe quel type de document (ex: "Attestation de baptême").
*   **Configuration** : Pour chaque document, l'école définit :
    *   Le code technique.
    *   Le nom affiché au parent.
    *   L'aspect obligatoire ou non.

---

## 5. Overrides et Hiérarchie
La puissance du système réside dans sa capacité à surcharger la configuration selon le contexte :

1.  **Global** : Configuration par défaut de l'établissement.
2.  **Cycle Override** : Surcharge les règles pour tout un cycle (ex: Maternelle vs Lycée).
3.  **Level Override** : Surcharge spécifique à un niveau (ex: la classe de Terminale a des documents en plus).
4.  **Year Override** : Contrôle si les inscriptions sont ouvertes pour une année spécifique (2025 vs 2026).

---

## 6. Endpoints API (Admin)

Tous les endpoints sont préfixés par `/api/v1/admin/config`.

### Configuration Générale
*   `GET /` : Récupère la configuration complète.
*   `PUT /` : Met à jour le schéma et les informations globales.
*   `POST /reset` : Réinitialise la configuration aux valeurs par défaut de Feewi.

### Contrôle du Portail
*   `PATCH /portal-status?active=true` : Ouvre ou ferme le portail public.

### Surcharges (Overrides)
*   `PUT /year-overrides/{yearId}` : Configure les dates d'ouverture pour une année.
*   `DELETE /year-overrides/{yearId}` : Supprime la surcharge annuelle.
*   `PUT /cycle-overrides/{cycleType}` : Configure les règles par cycle scolaire.
*   `PATCH /level-overrides/{levelId}` : Configure les quotas et règles par classe.

---

## 7. Exemple de Flux de Digitalisation
1.  **Initialisation** : L'école reçoit une config par défaut (Piliers standards activés).
2.  **Personnalisation** : L'école ajoute un champ "Taille de l'uniforme" dans le pilier `Identity`.
3.  **Documents** : Elle ajoute "Certificat médical" comme document obligatoire pour le cycle Primaire.
4.  **Ouverture** : Elle active le portail pour l'année scolaire 2026.
5.  **Suivi** : Elle définit un quota de 50 places pour la classe de CP (Level Override).
