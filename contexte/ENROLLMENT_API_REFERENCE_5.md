# Référence API : Enrollment Service (Architecture Piliers & CMS)

Ce document détaille la structure de données, l'intelligence temporelle et le moteur de calcul du service d'admission.

---

## 1. Intelligence Métier & Workflow

### 1.1 Transitions Automatiques (Workflow Prédictif)
L'action de vérification documentaire (`PATCH /verify`) est maintenant intelligente :
*   **Si `AssessmentType` est `EXAM` ou `INTERVIEW`** : Le dossier passe automatiquement au statut **`TESTING`**.
*   **Si `AssessmentType` est `DOSSIER`** : Le dossier passe directement au statut **`VERIFIED`** (prêt pour validation finale).

### 1.2 Moteur de Calcul des Moyennes
Lors de la saisie des notes (`PATCH /assessment`), le backend effectue les calculs suivants :
*   **Moyenne Pondérée** : Basée sur la Map `subjects` (Matière -> Coefficient) définie dans la configuration.
*   **Décision Automatique** : Si une `minPassingGrade` est configurée, le système positionne par défaut la décision à `ADMITTED` ou `REJECTED`.

### 1.3 Sélection de l'Année Cible (Double Cadenas)
Le système supporte le recrutement sur plusieurs années scolaires simultanément (ex: fin d'année en cours + rentrée prochaine).
*   **Source** : Le service interroge Academic Structure pour connaître les fenêtres d'inscription ouvertes.
*   **Filtre manuel** : L'école peut "fermer" une année spécifique via sa configuration, même si elle est dans les dates.

---

## 2. API Publique (Portail Parent)
Base URL : `/enrollment/api/v1/public/admissions`

### 2.1 Résumé du portail (`GET /config/summary`)
Permet au parent de choisir son année de rentrée.
```json
{
  "tenantId": "excellence",
  "portalActive": true,
  "availableYears": [
    {
      "id": "uuid-2025",
      "label": "2025-2026",
      "registrationEndDate": "2025-09-30",
      "active": true
    },
    {
      "id": "uuid-2026",
      "label": "2026-2027",
      "registrationEndDate": "2026-09-15",
      "active": true
    }
  ]
}
```

---

## 3. API Administration (Configuration)
Base URL : `/enrollment/api/v1/admin/config`

### 3.1 Contrôle Temporel & Opérationnel
*   **Verrou par Année** : `PUT /` (Champ `yearOverrides`). Permet de masquer une année du portail public.
*   **Verrou par Niveau** : `PATCH /level-overrides/{levelId}`. Permet de fermer les inscriptions pour une classe précise (ex: 6ème complète).

---

## 4. API Opérationnelle (Traitement des Dossiers)
Base URL : `/enrollment/api/v1/admin/admissions`

### 4.1 Saisie des Notes (`PATCH /{id}/assessment`)
*   **Payload** : 
```json
{
  "grades": { "Mathématiques": 14.0, "Français": 11.5 },
  "comments": "Bon niveau",
  "recommendedLevelId": "uuid"
}
```
*   **Réponse** : L'objet contient `averageGrade` (ex: `12.93`).

---

## 5. Modèles de Données (Typescript)

```typescript
export interface Admission {
  id: string;
  reference: string;
  identity: IdentityPillar;
  medical: MedicalPillar;
  schooling: SchoolingPillar;
  status: string;
}

export interface Assessment {
  grades: Record<string, number>;
  averageGrade?: number;
  decision: 'ADMITTED' | 'ADMITTED_WITH_RESERVE' | 'REJECTED';
}
```

---
*Documentation Technique - Mise à jour Workflow, Calculs & Temporalité - Avril 2026*
