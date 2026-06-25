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
    }
  ]
}
```

---

## 3. API Administration (Configuration & Pilotage)
Base URL : `/enrollment/api/v1/admin/config`

### 3.1 Le Master Switch (Interrupteur Global)
*   **URL** : `PATCH /portal-status?active={true|false}`
*   **Description** : Coupe ou ouvre instantanément TOUT le portail public, quelles que soient les dates.

### 3.2 Gestion de la Structure (Piliers & Champs)
*   **Récupérer** : `GET /` (Retourne l'objet `EnrollmentConfig` complet).
*   **Sauvegarder** : `PUT /`
  *   **Usage** : Permet de modifier les labels des piliers, d'ajouter/supprimer des champs personnalisés et de définir le `registrationMode`.
  *   **Contrainte (Gouvernance)** : On ne peut pas désactiver les piliers `pillar_identity` et `pillar_family`.

### 3.3 Contrôle Temporel (Par Année Scolaire)
*   **URL** : `PUT /` (Champ `yearOverrides`)
*   **Description** : Permet de gérer la liste des années visibles sur le portail public.
*   **Objet `YearOverride`** :
```json
"yearOverrides": {
  "uuid-année-2026": { "active": true },
  "uuid-année-2025": { "active": false } 
}
```

### 3.4 Contrôle Opérationnel (Par Niveau / Classe)
*   **URL** : `PATCH /level-overrides/{levelId}`
*   **Description** : Fine-tuning pour un niveau spécifique.
*   **Champs Clés** :
  *   `active` (boolean) : Ferme les inscriptions pour ce niveau uniquement (ex: 6ème complète).
  *   `maxNewEnrollments` (int) : Définit le quota de places nouvelles pour l'année.
  *   `pillarOverrides` : Permet de demander des champs différents (ex: "L'enfant est-il propre ?" uniquement en Maternelle).

### 3.5 Procédure de Secours
*   **URL** : `POST /reset`
*   **Usage** : Réinitialise tout (Piliers, Checklist, Dates) aux valeurs d'usine de Feewi.

---

## 4. API Opérationnelle (Traitement des Dossiers)
Base URL : `/enrollment/api/v1/admin/admissions`

### 4.1 Saisie des Notes (`PATCH /{id}/assessment`)
Le backend calcule automatiquement `averageGrade` et suggère la `decision`.

---

## 5. Modèles de Données (Typescript)

```typescript
export interface LevelOverride {
  active: boolean;
  maxNewEnrollments?: number;
  pillarOverrides: Record<string, PillarConfig>;
  assessmentConfig: AssessmentConfig;
}

export interface PillarConfig {
  label: string;
  enabled: boolean;
  systemFields: SystemFieldDefinition[];
  customFields: CustomFieldDefinition[];
}
```

---
*Documentation Technique - Pilotage CMS & Flux - Avril 2026*
