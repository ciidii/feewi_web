# Spécification d'Implémentation — Portail Public (API v8)

**Destinataire :** Gemini (implémentation)  
**Rédigé par :** Analyse Claude  
**Date :** Avril 2026  
**Branche cible :** `feat/enrollment-api-v7-migration`  
**API de référence :** `ENROLLMENT_API_REFERENCE_8.md`

---

## Table des matières

1. [Vision & Objectifs](#1-vision--objectifs)
2. [Analyse des gaps — état actuel vs API v8](#2-analyse-des-gaps)
3. [Architecture de la solution](#3-architecture-de-la-solution)
4. [Parcours UX complet — Spécification](#4-parcours-ux-complet)
5. [Spécifications composant par composant](#5-spécifications-composant-par-composant)
6. [Règles métier critiques](#6-règles-métier-critiques)
7. [Plan d'implémentation — Commits atomiques](#7-plan-dimplémentation)

---

## 1. Vision & Objectifs

### Ce que le portail doit faire

Le portail public est la face visible de l'école pour les familles. Il doit :

1. **Refléter exactement la configuration de l'établissement** — chaque champ affiché, chaque document demandé, chaque service proposé vient du backend via l'API v8. Aucun élément ne doit être hardcodé.
2. **Respecter les règles d'ouverture par année** — une année peut être fermée, limitée à un type (RE_ENROLLMENT seulement), ou imposer le mode guichet.
3. **Appliquer la hiérarchie d'overrides** — documents et services effectifs pour un niveau = base + cycle + level. C'est le serveur qui résout cette hiérarchie, pas le frontend.
4. **Offrir une UX fluide multi-enfants** — un bundle famille peut contenir N enfants. Le stepper doit permettre d'en ajouter plusieurs.

### Stack technique

- Angular 17+ Standalone Components
- Signals (`signal()`, `computed()`) — pas de RxJS dans les templates
- SCSS avec tokens `var(--fw-*)` — zéro CSS inline
- `ngModel` pour les formulaires (template-driven, consistant avec le reste)
- `lucide-angular` pour les icônes

---

## 2. Analyse des gaps

### 2.1 Landing (`public-landing.component`)

| Point | État actuel | API v8 / Attendu |
|---|---|---|
| Affichage années | Cartes simples avec `year.label` | Chaque année a `allowedTypes`, `registrationMode`, `state`, `levelStatuses` |
| Mode ADMIN_ONLY | Non géré | Si `registrationMode === 'ADMIN_ONLY'`, masquer le bouton « Commencer », afficher message secrétariat |
| Types d'inscription | Non affiché | Si une seule option dans `allowedTypes` → bouton direct. Si les deux → 2 boutons (Nouvelle inscription / Réinscription) |
| Liste d'attente | Non géré | Un niveau peut être `full: true` dans `levelStatuses` → l'afficher sur la card |
| Portal fermé | Page basique | OK — mais améliorer le message |
| `availableYears` vide | Non géré | Afficher « Inscriptions fermées » explicitement |

**Impact :** Refactoring significatif du template HTML et ajout de logique dans le TS.

---

### 2.2 Form Stepper (`public-form-stepper.component`)

| Point | État actuel | API v8 / Attendu |
|---|---|---|
| `AdmissionType` | Hardcodé `'NEW_ENROLLMENT'` | Vient du choix parent sur la landing (passé via queryParam `type`) |
| `cycleType` dans `addChild` | Non envoyé | Doit être dérivé du niveau sélectionné et envoyé à `POST /children` |
| Validation `allowedTypes` | Non | Vérifier que le type sélectionné est autorisé pour l'année avant de continuer |
| Documents effectifs | Vient de `config.schema.documents.presetDocuments` | Après `addChild`, la réponse contient `documents[]` déjà résolu (base+cycle+level). Utiliser `admission().documents` directement |
| Services | `formStore.services` = tableau `ServiceSubscriptionRequest[]` | OK structure, mais `StepServicesComponent` est hardcodé CANTEEN/TRANSPORT |
| Session multi-enfants | Pas de gestion | Prévoir la structure pour N enfants (voir §4) |
| Level config reload | Appel `getLevelConfig()` remplace tout `config` | Doit mettre à jour seulement les docs effectifs, pas écraser le schéma global |

---

### 2.3 StepServicesComponent

**État actuel — complètement hardcodé :**
```typescript
// PROBLÈME : hardcodé CANTEEN et TRANSPORT avec booléens
div *ngIf="hasService('CANTEEN')" (click)="services.canteen = !services.canteen"
div *ngIf="hasService('TRANSPORT')" (click)="services.transport = !services.transport"
```

**Attendu — entièrement dynamique depuis `schema.services.availableServices` :**
- Itérer sur `availableServices` (N services, pas seulement 2)
- Chaque service a `options: string[]` — si non vide → afficher un sélecteur d'option
- `mandatory: true` → service coché automatiquement, non désélectionnable
- Output : `ServiceSubscriptionRequest[]` avec `{ serviceCode, optionCode }`

---

### 2.4 StepIdentityComponent

**Problèmes actuels :**
- Champ `birthPlace` manquant dans le template
- Labels hardcodés au lieu d'utiliser `schema.identity.coreFieldControls[field].label`
- Pas de champ `academicYearId` visible (c'est un champ caché — OK, mais doit être peuplé)
- Pas de sélection du type d'inscription (NEW vs RE)

---

### 2.5 StepMedicalComponent

**Problèmes :**
- `bloodGroup` et `criticalAllergies` hardcodés — doivent venir de `schema.medical.customFields`
- Un champ de type `SELECT` avec `options: string[]` doit afficher un `<select>`, pas un `<input type="text">`
- Un champ de type `TEXTAREA` doit afficher `<textarea>`, pas `<input>`

---

### 2.6 StepFamilyComponent

**Problèmes :**
- `homeAddress` hardcodé en `data.customFields['homeAddress']`
- Les champs additionnels du tuteur doivent venir de `schema.family.guardianCustomFields`
- Labels des champs core doivent venir de `schema.family.guardianCoreFieldControls`

---

### 2.7 StepVault (Documents)

**Problème principal :**
Actuellement, les documents affichés viennent de `config.schema.documents.presetDocuments`.  
En v8, après `POST /children`, la réponse contient `admission.documents[]` déjà résolu par le serveur (base + cycle overrides + level overrides). C'est **cette liste** qui doit être affichée — pas le schéma global.

---

## 3. Architecture de la solution

### 3.1 Flux de données global

```
Landing
  ├── GET /public/config/summary
  │     → PublicPortalSummary { availableYears[], portalActive }
  │
  └── Parent choisit : année + type (NEW/RE)
        → navigate('/enrollment/form?yearId=X&type=NEW_ENROLLMENT')

Form Stepper (init)
  ├── GET /public/config/default
  │     → DefaultConfigResponse { schema, registrationMode }
  │     → Alimente tous les champs dynamiques (famille, identité, médical, services)
  │
  └── GET /academic/levels
        → Level[] { id, name, cycleType }

Step GUARDIAN → POST /bundles
  → AdmissionBundle { id, accessCode }
  + POST /bundles/{id}/children (avec yearId, levelId, cycleType, type)
  → Admission { id, documents[] }   ← checklist résolue (base+cycle+level)

Step STUDENT → PATCH /{id}/pillars/pillar_identity
             + PATCH /{id}/pillars/pillar_schooling
  [Si level change → GET /public/config/{levelId} pour update docs]

Step MEDICAL → PATCH /{id}/pillars/pillar_medical
             + PATCH /bundles/{id}/pillars/pillar_family

Step SERVICES → PATCH /{id}/subscriptions

Step DOCS → POST /{id}/documents/{code} (upload)

Step REVIEW → POST /bundles/{id}/submit
            → redirect tracker
```

### 3.2 Source de vérité pour les documents

```
admission().documents[]   ← SERVEUR RÉSOUT (base + cycle + level)
                           Mettre à jour après addChild() et après reload bundle
```

**Ne jamais** utiliser `config.schema.documents.presetDocuments` pour afficher la checklist au parent. Le schéma global est réservé à l'admin-config.

### 3.3 Source de vérité pour les services

```
config.schema.services.availableServices[]  ← liste des services disponibles
formStore.services: ServiceSubscriptionRequest[]  ← sélections du parent
```

### 3.4 Structure du FormStore étendu

```typescript
interface FormStore {
  // Contexte année/type (vient de la landing via queryParams)
  yearId: string;
  admissionType: 'NEW_ENROLLMENT' | 'RE_ENROLLMENT';

  family: {
    primaryGuardian: {
      firstName: string; lastName: string; email: string;
      phone: string; relation: GuardianRelation; financialResponsible: boolean;
      customFields: Record<string, any>;
    };
    secondaryGuardian?: Partial<Guardian>;
    customFields: Record<string, any>;
  };

  // Par enfant (index 0 = enfant actif)
  children: ChildFormData[];
  activeChildIndex: number;
}

interface ChildFormData {
  admissionId?: string;  // peuplé après addChild()
  identity: { firstName: string; lastName: string; gender: 'MALE'|'FEMALE'; birthDate: string; birthPlace: string; customFields: Record<string, any>; };
  schooling: { academicYearId: string; levelId: string; cycleType?: CycleType; filiereId: null|string; customFields: Record<string, any>; };
  medical: { customFields: Record<string, any>; };
  services: ServiceSubscriptionRequest[];
}
```

> **Note pour l'implémentation v1 :** Implémenter d'abord avec un seul enfant. Prévoir la structure multi-enfant mais ne pas implémenter le bouton « Ajouter un autre enfant » en première itération.

---

## 4. Parcours UX complet

### 4.1 Landing — Sélection de l'entrée

```
┌─────────────────────────────────────────────────────┐
│  PORTAIL D'ADMISSION — [Nom de l'école]              │
│  Statut : ● Ouvert / ○ Fermé                         │
│                                                       │
│  [Message de bienvenue si présent]                   │
│                                                       │
│  ┌──────────────────────────────────────────────┐   │
│  │  Année 2025-2026                              │   │
│  │  Du 15 jan → 31 mars                          │   │
│  │                                               │   │
│  │  [Nouvelle inscription]  [Réinscription]      │   │  ← si les deux types autorisés
│  │  ou [Commencer]                               │   │  ← si un seul type
│  │  ou [Contacter le secrétariat]                │   │  ← si ADMIN_ONLY
│  └──────────────────────────────────────────────┘   │
│                                                       │
│  ┌──────────────────────────────────────────────┐   │
│  │  Année 2026-2027  (PLANNING)                  │   │
│  │  Pré-inscriptions ouvertes                    │   │
│  │  [Pré-inscrire]                               │   │
│  └──────────────────────────────────────────────┘   │
│                                                       │
│  [Suivre un dossier existant]                        │
└─────────────────────────────────────────────────────┘
```

**Règles d'affichage de la year-card :**
- `registrationMode === 'ADMIN_ONLY'` → afficher message + bouton "Contacter le secrétariat" (lien mailto ou tel), masquer le formulaire en ligne
- `allowedTypes.length === 2` → 2 boutons distincts
- `allowedTypes.length === 1` → 1 bouton avec le libellé approprié ("Nouvelle inscription" ou "Réinscription")
- `availableYears.length === 0` → état "Inscriptions fermées"
- `!portalActive` → masquer les années, afficher page de fermeture globale

**Navigation :**
```
/enrollment/form?yearId={id}&type={NEW_ENROLLMENT|RE_ENROLLMENT}
```

---

### 4.2 Form Stepper — Structure des étapes

```
GUARDIAN → STUDENT → MEDICAL → [SERVICES] → DOCS → REVIEW
```

`SERVICES` n'apparaît que si `config.schema.services.enabled === true`.

#### Étape GUARDIAN — Identité du responsable

Champs à afficher :
1. **Champs core** (depuis `schema.family.guardianCoreFieldControls`) : lien de parenté, prénom, nom, téléphone
2. **Email** (champ fixe, toujours présent — pas dans les coreFieldControls)
3. **Champs custom** (depuis `schema.family.guardianCustomFields`) : itérer et rendre selon le type (`TEXT`, `TEXTAREA`, `SELECT`, `DATE`)

Labels : utiliser `guardianCoreFieldControls[field].label`, ex : `"Téléphone"` → peut être renommé par l'école.

**Actions à la validation :**
1. Si bundle existant → `PATCH /bundles/{id}/pillars/pillar_family` uniquement
2. Si nouveau dossier :
   - `POST /bundles` → obtenir `bundleId` + `accessCode`
   - Sauvegarder en session
   - `POST /bundles/{bundleId}/children` avec `{ firstName, lastName, gender, type, academicYearId, levelId, cycleType }`
   - Stocker `admission.id` et `admission.documents[]`

> À ce stade, `firstName/lastName/gender` de l'enfant peuvent être provisoires (on les mettra à jour en step STUDENT). L'important est de créer le child pour obtenir les documents résolus.

---

#### Étape STUDENT — Identité de l'élève

Champs à afficher :
1. **Niveau scolaire** (select depuis `availableLevels`) — obligatoire
2. **Champs core identité** (depuis `schema.identity.coreFieldControls`) :
   - `firstName` → label = `coreFieldControls.firstName.label`
   - `lastName` → label
   - `gender` → select MALE/FEMALE avec labels depuis config
   - `birthDate` → input type="date"
   - `birthPlace` → input type="text" (**MANQUANT actuellement**)
3. **Champs custom identité** (depuis `schema.identity.customFields`) : rendre dynamiquement selon type

**Sur changement de niveau :**
- Appeler `GET /public/config/{levelId}` pour obtenir la config effective
- Mettre à jour `admission.documents[]` avec les docs résolus du niveau
- Dériver `cycleType` depuis `availableLevels.find(l => l.id === levelId)?.cycleType`

**Actions à la validation :**
- `PATCH /{admissionId}/pillars/pillar_identity` avec les données identity
- `PATCH /{admissionId}/pillars/pillar_schooling` avec les données schooling

---

#### Étape MEDICAL — Santé

**Rendu entièrement dynamique** depuis `schema.medical.customFields`.

Pour chaque `FieldConfig` dans `customFields` :

```typescript
// Règle de rendu par type
if (field.type === 'SELECT' && field.options?.length) {
  // <select> avec les options
} else if (field.type === 'TEXTAREA') {
  // <textarea>
} else if (field.type === 'DATE') {
  // <input type="date">
} else if (field.type === 'BOOLEAN') {
  // <input type="checkbox"> ou toggle
} else {
  // <input type="text"> (TEXT, NUMBER → type="number")
}
```

**Ne pas hardcoder bloodGroup/criticalAllergies** — ils viennent du schéma.

**Actions à la validation :**
- `PATCH /{admissionId}/pillars/pillar_medical` avec les données medical

---

#### Étape SERVICES (conditionnelle)

Affichée uniquement si `config.schema.services.enabled === true`.

**Rendu entièrement dynamique** depuis `schema.services.availableServices`.

Pour chaque `ServiceConfig` :

```
┌──────────────────────────────────────────────────────┐
│  [Icône]  Cantine scolaire           [✓ coché]        │
│           Options : ○ Demi-pension  ○ Pension complète│
└──────────────────────────────────────────────────────┘
```

- `mandatory: true` → coché automatiquement, grisé (non désélectionnable), option obligatoire
- `options.length > 0` → afficher le sélecteur d'option (radio ou select), obligatoire avant de pouvoir continuer
- `options.length === 0` → juste une checkbox, pas d'option
- La sélection produit `{ serviceCode: svc.code, optionCode: selectedOption }`

**Validation avant de passer à l'étape suivante :**
- Tous les services `mandatory: true` doivent avoir une option choisie (si options > 0)
- Services optionnels : l'utilisateur peut ne pas sélectionner (omis du tableau envoyé)

**Actions à la validation :**
- Si au moins un service sélectionné → `PATCH /{admissionId}/subscriptions`
- Si aucun service → passer directement (pas d'appel API)

---

#### Étape DOCS — Dépôt des pièces

**Source des documents :** `admission().documents[]` — la liste résolue retournée par le serveur après `addChild()`.

**Ne pas** utiliser `config.schema.documents.presetDocuments`.

Pour chaque `RequiredDocument` :

```
┌──────────────────────────────────────────────────────┐
│  [Icône]  Extrait de naissance  [OBLIGATOIRE]        │
│           Status: ● Manquant / ✓ Téléchargé          │
│           [Choisir un fichier]                        │
└──────────────────────────────────────────────────────┘
```

- `status === 'MISSING'` → bouton upload actif
- `status === 'UPLOADED'` → nom du fichier + bouton "Remplacer"
- `mandatory: true` → badge rouge "Obligatoire"
- Upload → `POST /{admissionId}/documents/{doc.code}` avec la fileId obtenue depuis le `DocumentEngineService`

**Rafraîchissement après upload :**
- Après chaque upload réussi, recharger le bundle depuis `GET /bundles/{id}?accessCode={code}` pour mettre à jour `admission.documents[]`

---

#### Étape REVIEW — Récapitulatif & soumission

Afficher en lecture seule toutes les informations saisies :
- Section Famille (guardian prénom/nom/tel/relation)
- Section Élève (nom, niveau, date de naissance)
- Section Médical (champs non vides uniquement)
- Section Services (services souscrits avec option)
- Section Documents (checklist avec statut)

**Consentement légal :**
- Afficher `legalText` depuis `summary.legalText` (ou `config.legalText`)
- Checkbox d'acceptation — bloque le bouton "Soumettre" si non cochée

**Actions :**
- `POST /bundles/{bundleId}/submit`
- En cas de succès → redirect `'/enrollment/tracker/{reference}?accessCode={code}'`
- La session est effacée

---

### 4.3 Tracker — Suivi du dossier

Le tracker actuel est fonctionnel mais à enrichir :
- Afficher `trackerMessage` de l'API (déjà fait)
- Afficher la liste des documents avec leur statut (MISSING / UPLOADED / RECEIVED / VERIFIED / REJECTED)
- Afficher les services souscrits si `subscriptions.length > 0`

---

## 5. Spécifications composant par composant

### 5.1 `public-landing.component.ts` — Modifications

```typescript
// NOUVEAU computed
yearCards = computed(() => {
  const years = this.summary()?.availableYears ?? [];
  return years.map(y => ({
    ...y,
    isAdminOnly: y.registrationMode === 'ADMIN_ONLY',
    canNewEnrollment: y.allowedTypes.includes('NEW_ENROLLMENT'),
    canReEnrollment: y.allowedTypes.includes('RE_ENROLLMENT'),
    hasBothTypes: y.allowedTypes.length === 2
  }));
});

noYearsAvailable = computed(() =>
  this.summary() !== null && this.activeYears().length === 0
);
```

### 5.2 `public-landing.component.html` — Template

```html
<!-- Card pour chaque année -->
<div *ngFor="let year of yearCards()" class="year-card">
  <div class="year-header">
    <span class="year-badge" [class.planning]="year.state === 'PLANNING'">
      {{ year.state === 'PLANNING' ? 'Pré-inscriptions' : 'Inscriptions' }}
    </span>
    <h3>{{ year.label }}</h3>
  </div>

  <div class="year-dates">
    Du {{ year.registrationStartDate | date:'dd MMM' }}
    au {{ year.registrationEndDate | date:'dd MMM yyyy' }}
  </div>

  <p *ngIf="year.welcomeMessage" class="year-message">{{ year.welcomeMessage }}</p>

  <!-- Mode ADMIN_ONLY → pas de formulaire en ligne -->
  <div *ngIf="year.isAdminOnly" class="admin-only-notice">
    <lucide-icon [name]="Phone" [size]="16"></lucide-icon>
    <span>Inscriptions uniquement au guichet — contacter le secrétariat.</span>
  </div>

  <!-- Mode en ligne -->
  <ng-container *ngIf="!year.isAdminOnly">
    <!-- Les deux types autorisés -->
    <div *ngIf="year.hasBothTypes" class="type-buttons">
      <button class="btn-type new"
              [routerLink]="['/enrollment/form']"
              [queryParams]="{ yearId: year.id, type: 'NEW_ENROLLMENT' }">
        Nouvelle inscription
      </button>
      <button class="btn-type re"
              [routerLink]="['/enrollment/form']"
              [queryParams]="{ yearId: year.id, type: 'RE_ENROLLMENT' }">
        Réinscription
      </button>
    </div>

    <!-- Un seul type -->
    <button *ngIf="!year.hasBothTypes && year.canNewEnrollment"
            class="btn-start"
            [routerLink]="['/enrollment/form']"
            [queryParams]="{ yearId: year.id, type: 'NEW_ENROLLMENT' }">
      Commencer <lucide-icon [name]="ArrowRight" [size]="16"></lucide-icon>
    </button>

    <button *ngIf="!year.hasBothTypes && year.canReEnrollment"
            class="btn-start re"
            [routerLink]="['/enrollment/form']"
            [queryParams]="{ yearId: year.id, type: 'RE_ENROLLMENT' }">
      Réinscription <lucide-icon [name]="ArrowRight" [size]="16"></lucide-icon>
    </button>
  </ng-container>
</div>

<!-- Aucune année disponible -->
<div *ngIf="noYearsAvailable()" class="closed-state">
  <lucide-icon [name]="Clock" [size]="48"></lucide-icon>
  <h2>Inscriptions temporairement fermées</h2>
  <p>Aucune période d'inscription n'est ouverte. Revenez prochainement.</p>
</div>
```

---

### 5.3 `public-form-stepper.component.ts` — Modifications majeures

#### Lecture des queryParams

```typescript
ngOnInit() {
  const params = this.route.snapshot.queryParamMap;
  this.formStore.yearId = params.get('yearId') ?? '';
  this.formStore.admissionType = (params.get('type') as any) ?? 'NEW_ENROLLMENT';
  this.loadBootstrapData();
}
```

#### handleGuardianStep — addChild avec cycleType et type correct

```typescript
private async handleGuardianStep(): Promise<boolean> {
  const bundleId = this.bundle()?.id;

  if (bundleId) {
    await this.enrollmentService.updateFamilyPillar(bundleId, this.formStore.family).toPromise();
    return true;
  }

  // Créer le bundle
  const createReq: CreateBundleRequest = {
    tenantId: this.tenantContext.activeTenant()?.id ?? '',
    family: this.formStore.family
  };
  const bundle = await this.enrollmentService.createBundle(createReq).toPromise();
  if (!bundle?.id) return false;

  this.bundle.set(bundle);
  this.sessionService.saveSession(bundle.id, bundle.accessCode,
    this.formStore.family.primaryGuardian.firstName, 'STUDENT');

  // Créer l'enfant avec le type et cycleType corrects
  const activeChild = this.formStore.children[this.formStore.activeChildIndex];
  const addChildReq: AddChildRequest = {
    firstName: activeChild.identity.firstName || 'Candidat',
    lastName: activeChild.identity.lastName || this.formStore.family.primaryGuardian.lastName,
    gender: activeChild.identity.gender,
    type: this.formStore.admissionType,           // ← depuis queryParam
    academicYearId: this.formStore.yearId || 'current',
    levelId: activeChild.schooling.levelId || 'TEMP',
    cycleType: activeChild.schooling.cycleType    // ← dérivé du niveau sélectionné
  };

  const child = await this.enrollmentService.addChild(bundle.id, addChildReq).toPromise();
  if (!child?.id) return false;

  // Stocker l'admission ET sa checklist résolue
  activeChild.admissionId = child.id;
  this.admission.set(child);
  // child.documents[] est la liste résolue (base + cycle + level) — l'utiliser directement

  return true;
}
```

#### onLevelChange — Mettre à jour cycleType

```typescript
onLevelChange(levelId: string) {
  if (!levelId) return;
  const activeChild = this.formStore.children[this.formStore.activeChildIndex];
  activeChild.schooling.levelId = levelId;

  // Dériver le cycleType depuis la liste des niveaux
  const level = this.availableLevels().find(l => l.id === levelId);
  if (level?.cycleType) activeChild.schooling.cycleType = level.cycleType;

  // Recharger la config effective pour mettre à jour les documents affichés
  this.enrollmentService.getLevelConfig(levelId).subscribe(cfg => {
    // Mettre à jour les champs custom (si override de schéma)
    this.levelConfig.set(cfg);
    // NE PAS remplacer config() globalement — garder le schéma pour les autres piliers
  });
}
```

> **Important :** Introduire un signal séparé `levelConfig = signal<LevelConfigResponse | null>(null)` pour la config effective du niveau, distinct de `config` (config globale). Les documents affichés dans StepVault viennent de `admission().documents[]`, pas de levelConfig.

---

### 5.4 `StepServicesComponent` — Réécriture complète

**Fichier :** `step-services.component.ts`

```typescript
import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Utensils, Bus, BookOpen, Heart, Star } from 'lucide-angular';
import { ServiceConfig } from '../../../../../../core/models/enrollment';
import { ServiceSubscriptionRequest } from '../../../../../../core/models/enrollment';

interface ServiceSelection {
  svc: ServiceConfig;
  selected: boolean;
  selectedOption: string;
}

@Component({
  selector: 'app-step-services',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="step-content animate-fade">
      <div class="content-header">
        <h1>Services Additionnels</h1>
        <p>Sélectionnez les prestations souhaitées pour l'élève.</p>
      </div>

      <div class="services-stack">
        <div *ngFor="let item of selections" class="service-card-premium"
             [class.active]="item.selected"
             [class.mandatory]="item.svc.mandatory"
             (click)="!item.svc.mandatory && toggleService(item)">

          <div class="icon-box">
            <lucide-icon [name]="getIcon(item.svc.code)" [size]="24"></lucide-icon>
          </div>

          <div class="info">
            <span class="title">{{ item.svc.label }}</span>
            <span class="mandatory-badge" *ngIf="item.svc.mandatory">Obligatoire</span>

            <!-- Sélecteur d'option (si le service a des options et est sélectionné) -->
            <div class="options-row" *ngIf="item.selected && item.svc.options.length > 0" (click)="$event.stopPropagation()">
              <label class="option-label">Choisir une option :</label>
              <div class="option-chips">
                <button *ngFor="let opt of item.svc.options" class="opt-chip"
                        [class.active]="item.selectedOption === opt"
                        (click)="selectOption(item, opt); $event.stopPropagation()">
                  {{ opt }}
                </button>
              </div>
            </div>
          </div>

          <div class="check-box" [class.checked]="item.selected"></div>
        </div>

        <div *ngIf="!availableServices?.length" class="empty-services">
          <p>Aucun service disponible pour ce niveau.</p>
        </div>
      </div>
    </div>
  `
})
export class StepServicesComponent implements OnChanges {
  @Input() availableServices: ServiceConfig[] = [];
  @Output() selectionsChange = new EventEmitter<ServiceSubscriptionRequest[]>();

  selections: ServiceSelection[] = [];

  ngOnChanges() {
    this.selections = (this.availableServices ?? []).map(svc => ({
      svc,
      selected: svc.mandatory,       // services mandatory = pré-sélectionnés
      selectedOption: svc.mandatory && svc.options.length > 0 ? svc.options[0] : ''
    }));
    this.emit();
  }

  toggleService(item: ServiceSelection) {
    item.selected = !item.selected;
    if (!item.selected) item.selectedOption = '';
    this.emit();
  }

  selectOption(item: ServiceSelection, opt: string) {
    item.selectedOption = opt;
    this.emit();
  }

  private emit() {
    const result: ServiceSubscriptionRequest[] = this.selections
      .filter(item => item.selected)
      .map(item => ({
        serviceCode: item.svc.code,
        optionCode: item.selectedOption
      }));
    this.selectionsChange.emit(result);
  }

  isValid(): boolean {
    // Tous les services sélectionnés avec options doivent avoir une option choisie
    return this.selections
      .filter(item => item.selected && item.svc.options.length > 0)
      .every(item => !!item.selectedOption);
  }

  getIcon(code: string) {
    // Mapping par code — fallback sur Star
    const icons: Record<string, any> = {
      'CANTEEN': Utensils,
      'TRANSPORT': Bus,
      'AFTER_SCHOOL_CARE': BookOpen,
    };
    return icons[code] ?? Star;
  }

  readonly Utensils = Utensils; readonly Bus = Bus;
  readonly BookOpen = BookOpen; readonly Star = Star;
}
```

**Binding dans le stepper :**
```html
<!-- Dans public-form-stepper.component.html -->
<app-step-services
  *ngIf="currentStep() === 'SERVICES'"
  [availableServices]="config()?.schema?.services?.availableServices ?? []"
  (selectionsChange)="formStore.children[formStore.activeChildIndex].services = $event">
</app-step-services>
```

---

### 5.5 `StepIdentityComponent` — Refactoring

Remplacer par un template entièrement label-aware :

```html
<div class="step-content animate-fade">
  <div class="content-header">
    <h1>L'Élève</h1>
    <p>Informations d'état civil et vœu de scolarité.</p>
  </div>

  <div class="premium-form-grid">
    <!-- Niveau scolaire -->
    <div class="form-group full">
      <label>{{ coreLabels('levelId') }}</label>
      <select [(ngModel)]="schooling.levelId" (change)="onLevelChange.emit(schooling.levelId)"
              class="premium-select highlight">
        <option value="">Sélectionnez un niveau...</option>
        <option *ngFor="let level of availableLevels" [value]="level.id">{{ level.name }}</option>
      </select>
    </div>

    <!-- Champs core identité -->
    <div class="form-group">
      <label>{{ coreLabels('firstName') }}</label>
      <input type="text" [(ngModel)]="identity.firstName" class="premium-input">
    </div>
    <div class="form-group">
      <label>{{ coreLabels('lastName') }}</label>
      <input type="text" [(ngModel)]="identity.lastName" class="premium-input">
    </div>
    <div class="form-group">
      <label>{{ coreLabels('gender') }}</label>
      <select [(ngModel)]="identity.gender" class="premium-select">
        <option value="MALE">Masculin</option>
        <option value="FEMALE">Féminin</option>
      </select>
    </div>
    <div class="form-group">
      <label>{{ coreLabels('birthDate') }}</label>
      <input type="date" [(ngModel)]="identity.birthDate" class="premium-input">
    </div>
    <div class="form-group">
      <label>{{ coreLabels('birthPlace') }}</label>
      <input type="text" [(ngModel)]="identity.birthPlace" class="premium-input" placeholder="Ville de naissance">
    </div>

    <!-- Champs custom dynamiques -->
    <ng-container *ngFor="let field of customFields">
      <div class="form-group" [class.full]="field.type === 'TEXTAREA'">
        <label>{{ field.label }} <span *ngIf="field.mandatory" class="req">*</span></label>
        <ng-container [ngSwitch]="field.type">
          <select *ngSwitchCase="'SELECT'" [(ngModel)]="identity.customFields[field.name]" class="premium-select">
            <option value="">Sélectionner...</option>
            <option *ngFor="let opt of field.options ?? []" [value]="opt">{{ opt }}</option>
          </select>
          <textarea *ngSwitchCase="'TEXTAREA'" [(ngModel)]="identity.customFields[field.name]" class="premium-textarea" rows="3"></textarea>
          <input *ngSwitchDefault type="text" [(ngModel)]="identity.customFields[field.name]" class="premium-input">
        </ng-container>
      </div>
    </ng-container>
  </div>
</div>
```

```typescript
@Input() coreFieldControls: Record<string, { label: string }> = {};

coreLabels(field: string): string {
  return this.coreFieldControls?.[field]?.label ?? field;
}
```

---

### 5.6 `StepMedicalComponent` — Rendu entièrement dynamique

**Supprimer** tout le HTML hardcodé.

```html
<div class="step-content animate-fade">
  <div class="content-header">
    <h1>Santé</h1>
    <p>Données médicales confidentielles.</p>
  </div>

  <div class="premium-form-grid" *ngIf="customFields.length > 0; else noMedical">
    <ng-container *ngFor="let field of customFields">
      <div class="form-group" [class.full]="field.type === 'TEXTAREA'">
        <label>{{ field.label }} <span *ngIf="field.mandatory" class="req">*</span></label>
        <ng-container [ngSwitch]="field.type">
          <select *ngSwitchCase="'SELECT'" [(ngModel)]="medical.customFields[field.name]" class="premium-select">
            <option value="">—</option>
            <option *ngFor="let opt of field.options ?? []" [value]="opt">{{ opt }}</option>
          </select>
          <textarea *ngSwitchCase="'TEXTAREA'" [(ngModel)]="medical.customFields[field.name]" class="premium-textarea" rows="3"></textarea>
          <input *ngSwitchDefault type="text" [(ngModel)]="medical.customFields[field.name]" class="premium-input">
        </ng-container>
      </div>
    </ng-container>
  </div>

  <ng-template #noMedical>
    <div class="empty-step-hint">
      <lucide-icon [name]="Info" [size]="20"></lucide-icon>
      <p>Aucune information médicale requise par l'établissement.</p>
    </div>
  </ng-template>
</div>
```

---

### 5.7 `StepFamilyComponent` — Labels dynamiques

Ajouter `@Input() coreFieldControls` et `@Input() customFields` pour les labels :

```typescript
@Input() data: any;
@Input() coreFieldControls: Record<string, { label: string }> = {};
@Input() customFields: FieldConfig[] = [];  // champs additionnels famille

coreLabel(field: string): string {
  return this.coreFieldControls?.[field]?.label ?? field;
}
```

Les champs `homeAddress` et autres customs famille doivent venir de `guardianCustomFields`, pas être hardcodés.

---

### 5.8 `StepVaultComponent` — Utiliser `admission.documents[]`

**Input à changer :**
```typescript
// AVANT
@Input() documents: PresetDocumentConfig[] = [];

// APRÈS
@Input() documents: RequiredDocument[] = [];  // depuis admission().documents
```

Afficher `doc.status` pour chaque document :
- `MISSING` → bouton upload actif
- `UPLOADED` → icône checkmark + lien fichier + bouton "Remplacer"
- `RECEIVED` / `VERIFIED` → badge "Reçu/Vérifié", pas de re-upload

```html
<div *ngFor="let doc of documents" class="vault-card" [class.success]="doc.status === 'UPLOADED'">
  <div class="vault-icon">
    <lucide-icon [name]="doc.status === 'UPLOADED' ? CheckCircle : FileText" [size]="20"></lucide-icon>
  </div>
  <div class="vault-info">
    <span class="vault-label">{{ doc.name }}</span>
    <span class="vault-meta">
      <span *ngIf="doc.mandatory" class="req-badge">Obligatoire</span>
      <span class="status-text" [class.ok]="doc.status === 'UPLOADED'">
        {{ doc.status === 'UPLOADED' ? '✓ Téléchargé' : 'En attente' }}
      </span>
    </span>
  </div>
  <button class="btn-vault" (click)="fileInput.click()"
          [disabled]="uploadingCode === doc.code">
    <lucide-icon *ngIf="uploadingCode !== doc.code" [name]="Upload" [size]="16"></lucide-icon>
    <lucide-icon *ngIf="uploadingCode === doc.code" [name]="RefreshCw" [size]="16" class="animate-spin"></lucide-icon>
    {{ doc.status === 'UPLOADED' ? 'Remplacer' : 'Choisir' }}
  </button>
  <input #fileInput type="file" hidden accept=".pdf,.jpg,.jpeg,.png"
         (change)="onFileSelected.emit({ code: doc.code, event: $event })">
</div>
```

---

## 6. Règles métier critiques

### 6.1 Validation avant `addChild`

```typescript
// Avant POST /children — vérifier les règles d'ouverture
// Ces erreurs sont aussi retournées par le serveur en 422,
// mais on peut les anticiper côté client pour un meilleur UX.

// 1. L'année existe dans availableYears (checked côté landing, mais défense en profondeur)
// 2. Le type sélectionné est dans year.allowedTypes
// → Si 422 reçu : afficher le message d'erreur du serveur (error.message)
```

### 6.2 ADMIN_ONLY global vs par année

- `portalActive: false` (global) → page de fermeture totale, aucun formulaire
- `registrationMode: 'ADMIN_ONLY'` sur une année → masquer formulaire pour cette année seulement, afficher les autres années

### 6.3 Documents résolus vs schéma global

```
admission.documents[]     → TOUJOURS utiliser pour la checklist parent
config.schema.documents   → JAMAIS utiliser côté public pour la checklist
```

Le serveur applique la hiérarchie base → cycle → level. Le frontend n'a pas à la recalculer.

### 6.4 Services — optionCode obligatoire si options présentes

Si un service est sélectionné et a des options (`options.length > 0`), l'`optionCode` est obligatoire dans le payload. Le bouton « Suivant » doit être désactivé si cette condition n'est pas remplie.

### 6.5 cycleType dans addChild

Le `cycleType` n'est pas directement sur l'objet `Level` retourné par l'API académique (vérifier le modèle). S'il n'est pas disponible, ne pas l'envoyer (le champ est optionnel en v8). L'envoyer quand disponible optimise la résolution des overrides de cycle côté serveur.

### 6.6 Session multi-onglets

La session (bundleId + accessCode) est stockée dans `localStorage` via `AdmissionSessionService`. Si le parent reprend sa session dans un autre onglet, le stepper doit recharger l'état depuis `GET /bundles/{id}?accessCode={code}`.

---

## 7. Plan d'implémentation — Commits atomiques

### Commit A — Landing : multi-année, types, ADMIN_ONLY

**Fichiers :** `public-landing.component.ts`, `public-landing.component.html`, `public-landing.component.scss`

**Changements TS :**
- Ajouter computed `yearCards()` avec `isAdminOnly`, `canNewEnrollment`, `canReEnrollment`, `hasBothTypes`
- Ajouter computed `noYearsAvailable()`
- Ajouter icône `Phone` dans les imports Lucide

**Changements HTML :**
- Remplacer `<div *ngFor="let year of activeYears()">` par la nouvelle structure avec dual-buttons
- Ajouter le bloc ADMIN_ONLY
- Ajouter le bloc `noYearsAvailable()`

**Changements SCSS :**
- `.btn-type.new`, `.btn-type.re` — variantes de boutons d'action
- `.admin-only-notice` — bandeau informatif
- `.year-badge.planning` — badge état de l'année

---

### Commit B — Stepper : lecture queryParams type + addChild corrigé

**Fichiers :** `public-form-stepper.component.ts`

**Changements :**
- Lire `type` depuis `queryParams` dans `ngOnInit`
- Restructurer `formStore` : `yearId`, `admissionType`, `children[0]`, `activeChildIndex`
- Mettre à jour `handleGuardianStep()` pour envoyer `type` et `cycleType`
- Mettre à jour `onLevelChange()` pour dériver `cycleType` depuis `availableLevels`
- Introduire `levelConfig = signal<LevelConfigResponse | null>(null)` séparé de `config`
- Mettre à jour les bindings dans les appels aux step components (nouveaux @Inputs)

---

### Commit C — StepServices : réécriture dynamique

**Fichiers :** `step-services.component.ts`

**Changements :**
- Réécriture complète selon la spec §5.4
- Input : `availableServices: ServiceConfig[]`
- Output : `selectionsChange: EventEmitter<ServiceSubscriptionRequest[]>`
- Méthode `isValid()` exposée pour que le stepper bloque le « Suivant »

---

### Commit D — StepIdentity + StepFamily + StepMedical : labels dynamiques

**Fichiers :** `step-identity.component.ts`, `step-family.component.ts`, `step-medical.component.ts`

**Changements :**
- Ajouter `@Input() coreFieldControls` dans StepIdentity et StepFamily
- Méthode `coreLabel(field)` dans chaque composant
- Ajouter champ `birthPlace` manquant dans StepIdentity
- Rendre StepMedical entièrement dynamique (supprimer hardcoded bloodGroup/allergies)
- Rendre StepFamily : labels depuis `guardianCoreFieldControls`, custom fields depuis `guardianCustomFields`
- Rendu conditionnel par `field.type` dans StepIdentity et StepMedical (SELECT, TEXTAREA, etc.)

---

### Commit E — StepVault : utiliser `admission.documents[]`

**Fichiers :** `step-vault.component.ts` (et template)

**Changements :**
- Changer `@Input() documents` de `PresetDocumentConfig[]` vers `RequiredDocument[]`
- Afficher `doc.status` visuellement
- Ajouter état UPLOADED/RECEIVED/VERIFIED
- Mettre à jour le binding dans `public-form-stepper.component.html` : `[documents]="admission()?.documents ?? []"`

---

### Commit F — Stepper HTML : bindings mis à jour

**Fichiers :** `public-form-stepper.component.html`

**Changements :**
- Tous les bindings des step components mis à jour avec les nouveaux @Inputs
- `[availableServices]` → `config()?.schema?.services?.availableServices ?? []`
- `[documents]` → `admission()?.documents ?? []`
- `[coreFieldControls]` pour identity/family/medical
- Step SERVICES : `(selectionsChange)` → met à jour `formStore.children[0].services`

---

### Commit G — StepReview : récapitulatif et consentement légal

**Fichiers :** `step-review.component.ts`

**Changements :**
- Afficher les données du bundle (guardian) et de l'admission (enfant)
- Afficher les services souscrits
- Afficher le statut des documents
- Checkbox consentement liée à `legalText` (vient de `summary.legalText` ou `config.legalText`)
- Exposer `@Output() consentChanged` vers le stepper parent

---

## Annexe — Interfaces Angular à jour (rappel)

```typescript
// Depuis dtos.ts — déjà en place
interface AvailableYearSummary {
  id: string;
  label: string;
  state: AcademicYearState;
  registrationStartDate: string;
  registrationEndDate: string;
  active: boolean;
  allowedTypes: AdmissionType[];
  registrationMode: RegistrationMode;
  welcomeMessage?: string;
  levelStatuses: Record<string, { active: boolean; full: boolean }>;
}

// Depuis entities.ts — déjà en place
interface RequiredDocument {
  code: string;
  name: string;
  mandatory: boolean;
  status: DocumentStatus;  // 'MISSING' | 'UPLOADED' | 'RECEIVED' | 'VERIFIED' | 'REJECTED'
  fileUrl?: string | null;
}

// Depuis dtos.ts — déjà en place
interface ServiceSubscriptionRequest {
  serviceCode: string;
  optionCode: string;   // ← v8 : optionCode (pas option)
}

// Depuis config.ts — déjà en place
interface ServiceConfig {
  code: string;
  label: string;
  options: string[];
  mandatory: boolean;
  preset?: boolean;
}

// Depuis dtos.ts — déjà en place
interface AddChildRequest {
  firstName: string; lastName: string; gender: 'MALE'|'FEMALE';
  type: AdmissionType;
  academicYearId: string; levelId: string;
  cycleType?: CycleType;   // ← v8 : optionnel mais à envoyer si connu
}
```

---

## Résumé des fichiers à modifier/créer

| Fichier | Action | Commits |
|---|---|---|
| `public-landing.component.ts` | Modifier | A |
| `public-landing.component.html` | Modifier | A |
| `public-landing.component.scss` | Modifier | A |
| `public-form-stepper.component.ts` | Modifier (majeur) | B, F |
| `public-form-stepper.component.html` | Modifier | F |
| `step-services.component.ts` | Réécriture | C |
| `step-identity.component.ts` | Modifier | D |
| `step-family.component.ts` | Modifier | D |
| `step-medical.component.ts` | Modifier | D |
| `step-vault.component.ts` | Modifier | E |
| `step-review.component.ts` | Modifier | G |

**Modèles et services : aucune modification nécessaire** — tout est déjà à jour (migration v8 déjà effectuée).

---

*Document de spécification — Feewi © 2026 — v1.0*
