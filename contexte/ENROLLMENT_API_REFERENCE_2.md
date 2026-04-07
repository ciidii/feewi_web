# Référence API : Enrollment Service (Architecture 4 Piliers & Bundles)

Ce document détaille la nouvelle structure de données unifiée pour le passage à l'architecture SaaS par Piliers et la gestion des fratries (Bundles).

---

## 1. La Nouvelle Vision : "Piliers & Hiérarchie"
Le système passe d'un dossier "plat" à une structure thématique pour garantir la sécurité et la flexibilité :
*   **Family Bundle (Le Tronc)** : Regroupe les informations partagées par une fratrie (Parents, Adresse).
*   **Admission (La Branche)** : Informations spécifiques à chaque enfant découpées en 3 piliers système (Identité, Santé, Scolarité) + Piliers libres.

---

## 2. API Publique (Portail Parent)
Base URL : `/enrollment/api/v1/public/admissions`

### 2.1 Initialiser une Inscription (Dossier Familial)
C'est le nouveau point d'entrée unique. Même pour un enfant seul, un "Bundle" est créé.

*   **URL** : `POST /`
*   **Payload (`CreateBundleRequest`)** :
```json
{
  "tenantId": "school-test",
  "family": {
    "primaryGuardian": { "firstName": "...", "email": "...", "isFinancialResponsible": true },
    "homeAddress": "Dakar, Plateau",
    "customFields": { "family_loyalty": "NEW" }
  },
  "children": [
    {
      "firstName": "Adama",
      "lastName": "Diallo",
      "gender": "MALE",
      "academicYearId": "uuid",
      "levelId": "uuid"
    }
  ]
}
```
*   **Réponse (`AdmissionBundleResponse`)** : Retourne l'ID du bundle, l'**AccessCode unique pour toute la famille** et la liste des demandes enfants.

### 2.2 Suivi & Actions
*   **Suivi (Tracking)** : `GET /{reference}/track?accessCode={code}`
*   **Upload Document** : `POST /{id}/documents/{docCode}` (Utilise l'UUID de l'enfant).

---

## 3. API Administration (Dashboard & Secrétariat)
Base URL : `/enrollment/api/v1/admin/admissions`

### 3.1 Liste Paginée (Audit des Piliers)
*   **URL** : `GET /`
*   **Réponse (`Page<AdmissionAdminResponse>`)** :
```json
{
  "content": [
    {
      "id": "uuid-enfant",
      "bundleId": "uuid-famille",
      "reference": "ADM-2026-XXXX",
      "status": "SUBMITTED",
      "identity": { "firstName": "Adama", "lastName": "Diallo", "gender": "M" },
      "medical": { "bloodGroup": "O+", "criticalAllergies": "Asthme" },
      "schooling": { "levelId": "...", "previousSchool": "..." }
    }
  ]
}
```

---

## 4. Modèles de Données (Contrat de Migration Angular)

### 🟦 Les Piliers Système (Core)
| Pilier | Contenu Principal |
| :--- | :--- |
| **`identity`** | État civil, Naissance, Nationalité. |
| **`medical`** | Groupe sanguin, Allergies, Contact Urgence. |
| **`family`** | Responsables (Père/Mère), Adresse, Volet Financier. |
| **`schooling`** | Vœu de niveau, Filière, École d'origine. |

### 🟦 Changements Majeurs (Breaking Changes)
1.  **AccessCode** : Déplacé de l'enfant vers le **Bundle**.
2.  **Champs Personnalisés** : Ils ne sont plus dans une Map globale mais **distribués** dans chaque pilier (ex: `admission.identity.customFields`).
3.  **Responsabilité Financière** : Nouveau flag `isFinancialResponsible` dans l'objet Guardian.
4.  **URLs** : Normalisation sur le pluriel `/admissions` pour tous les endpoints.

---

## 5. Exemple de Modèle Typescript (Cible)

```typescript
export interface Admission {
  id: string;
  bundleId: string;
  status: string;
  identity: IdentityPillar;
  medical: MedicalPillar;
  schooling: SchoolingPillar;
  extraPillars: Record<string, any>; // Pour les piliers libres de l'école
}

export interface FamilyPillar {
  primaryGuardian: GuardianInfo;
  secondaryGuardian?: GuardianInfo;
  homeAddress: string;
}
```

---
*Documentation Technique - Mise à jour pour Architecture 4 Piliers - Avril 2026*
