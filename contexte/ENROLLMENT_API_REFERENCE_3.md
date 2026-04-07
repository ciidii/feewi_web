# Référence API : Enrollment Service (Architecture 4 Piliers & Bundles)

Ce document détaille la structure de données unifiée et les interfaces de configuration pour le passage à l'architecture SaaS par Piliers.

---

## 1. La Vision : "Piliers & Hiérarchie"
Le système est structuré autour de **Piliers thématiques**. L'école peut personnaliser les libellés et ajouter des champs dans chaque pilier.
*   **Family Bundle (Le Tronc)** : Porte les infos communes (Parent, Adresse).
*   **Admission (La Branche)** : Porte les infos spécifiques à l'enfant (Identité, Santé, Scolarité).

---

## 2. API Publique (Portail Parent)
Base URL : `/enrollment/api/v1/public/admissions`

### 2.1 Résumé du portail (Landing Page)
Permet d'afficher l'accueil du portail avec le mode d'inscription et la disponibilité des niveaux.

*   **URL** : `GET /config/summary`
*   **Réponse (`PublicPortalSummary`)** :
```json
{
  "tenantId": "excellence",
  "portalActive": true,
  "registrationMode": "PARENT_ONLY",
  "academicYearLabel": "2026-2027",
  "withinDates": true,
  "levelStatuses": {
    "uuid-6eme": { "active": true, "full": false },
    "uuid-cm1": { "active": false, "full": true }
  }
}
```

### 2.2 Configuration Effective (Générateur de Formulaire)
Retourne les règles de saisie pour un niveau donné.

*   **URL** : `GET /config/{levelId}`
*   **Réponse (`EffectiveConfigResponse`)** :
```json
{
  "pillars": {
    "pillar_identity": {
      "label": "Identité de l'élève",
      "customFields": [ { "name": "religion", "label": "Religion", "type": "TEXT" } ]
    }
  },
  "documentChecklist": [ { "code": "EXT", "name": "Extrait de naissance", "mandatory": true } ]
}
```

---

## 3. API Administration (Configuration CMS)
Base URL : `/enrollment/api/v1/admin/config`

### 3.1 Gérer la structure du formulaire
L'école définit ici quels champs elle souhaite demander.

*   **Récupérer** : `GET /`
*   **Sauvegarder** : `PUT /`
*   **Réinitialiser** : `POST /reset` (Remet les 4 Piliers système par défaut de Feewi).

### 3.2 Contrôle de Flux & Overrides
*   **Statut Global** : `PATCH /portal-status?active=true`
*   **Exceptions par Niveau** : `PATCH /level-overrides/{levelId}`
    *   Permet de désactiver un niveau spécifique (`active: false`).
    *   Permet de définir un quota (`maxNewEnrollments: 20`).

---

## 4. Modèles de Données (Contrat Angular)

### 🟦 Les 4 Piliers Système (Indispensables)
| Clé JSON | Libellé par défaut | Portée |
| :--- | :--- | :--- |
| **`pillar_identity`** | Identité | Enfant |
| **`pillar_medical`** | Santé | Enfant |
| **`pillar_family`** | Famille | Bundle (Parent) |
| **`pillar_schooling`** | Scolarité | Enfant |

### 🟦 Types de champs supportés
Le Frontend doit être capable de générer des inputs pour ces types :
- `TEXT` : Input classique.
- `NUMBER` : Input numérique.
- `DATE` : Datepicker.
- `BOOLEAN` : Checkbox / Switch.

---

## 5. Exemple de soumission groupée (Bundle)
*   **URL** : `POST /enrollment/api/v1/public/admissions`
```json
{
  "family": { "primaryGuardian": { "email": "...", "isFinancialResponsible": true } },
  "children": [ { "firstName": "Enfant 1", "levelId": "..." }, { "firstName": "Enfant 2" } ]
}
```

---
*Documentation Technique - Mise à jour Configuration Piliers - Avril 2026*
