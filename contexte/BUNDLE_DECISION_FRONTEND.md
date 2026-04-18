# Intégration Frontend — Portail Parent & Décision Bundle

> **Destinataire :** Équipe Angular  
> **Base URL via Gateway :** `http://localhost:8080/enrollment`  
> **Auth :** Aucune pour les endpoints `/public/**` — pas de JWT requis  
> **Header requis :** `X-Tenant-Id: <tenantId>` sur toutes les requêtes

---

## 1. Concepts clés

### Bundle (Dossier Famille)
Un bundle regroupe les dossiers de **tous les enfants** d'une même famille pour une même année scolaire.  
Il est créé une seule fois, puis enrichi enfant par enfant.

### Admission (Dossier Enfant)
Un dossier individuel par enfant, rattaché à un bundle.

### `decisionState` — l'état décisionnel du bundle
Champ **calculé côté serveur**, jamais stocké. Retourné dans chaque réponse bundle.

| Valeur | Signification | Action frontend |
|---|---|---|
| `AWAITING_SCHOOL` | Au moins 1 enfant encore en cours de traitement | Afficher un loader/timeline, aucun bouton d'action |
| `PAYMENT_REQUIRED` | Tous admis — paiement direct attendu | Afficher le bouton "Payer" → déclenche billing |
| `PARENT_CHOICE` | Mix admis + refusés — choix binaire requis | Afficher 2 boutons : "Valider les admis" / "Tout annuler" |
| `CLOSED` | Tous refusés/annulés/validés | Afficher un état final, aucune action possible |

---

## 2. Interfaces TypeScript

```typescript
// ── Enums ──────────────────────────────────────────────────────────────────

type AdmissionStatus =
  | 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'TESTING'
  | 'ADMITTED' | 'VALIDATED' | 'WAITLIST' | 'REJECTED' | 'CANCELLED';

type BundleDecisionState =
  | 'AWAITING_SCHOOL' | 'PAYMENT_REQUIRED' | 'PARENT_CHOICE' | 'CLOSED';

type AdmissionType = 'NEW_ENROLLMENT' | 'RE_ENROLLMENT';

// ── Tuteur ─────────────────────────────────────────────────────────────────

interface GuardianInfo {
  firstName: string;
  lastName: string;
  phone: string;          // format E.164 recommandé : "+221771234567"
  email?: string;
  relation: string;       // ex: "FATHER", "MOTHER", "GUARDIAN"
}

// ── Pilier Famille ─────────────────────────────────────────────────────────

interface FamilyPillar {
  primaryGuardian: GuardianInfo;
  secondaryGuardian?: GuardianInfo;
  customFields?: Record<string, unknown>; // "homeAddress", champs custom école
}

// ── Identité Enfant ────────────────────────────────────────────────────────

interface IdentityPillar {
  firstName: string;
  lastName: string;
  gender?: 'MALE' | 'FEMALE';
  birthDate?: string;       // ISO 8601 : "2015-03-22"
  birthPlace?: string;
  nationality?: string;
  customFields?: Record<string, unknown>;
}

// ── Document requis ────────────────────────────────────────────────────────

interface RequiredDocument {
  code: string;          // ex: "BIRTH_CERTIFICATE"
  label: string;
  required: boolean;
  fileUrl?: string;      // null si non encore uploadé
}

// ── Admission (enfant) ─────────────────────────────────────────────────────

interface AdmissionResponse {
  id: string;                      // UUID
  reference: string;               // ex: "ADM-2026-ABC"
  type: AdmissionType;
  status: AdmissionStatus;
  identity?: IdentityPillar;
  documents?: RequiredDocument[];
  trackerMessage: string;          // Message lisible pour affichage au parent
  createdAt: string;               // ISO 8601
  updatedAt: string;
}

// ── Bundle (famille) ───────────────────────────────────────────────────────

interface AdmissionBundleResponse {
  id: string;                      // UUID — à stocker localement pour les appels suivants
  reference: string;               // ex: "FAM-2026-XYZ"
  accessCode: string;              // Code à 4 caractères — à stocker impérativement
  family: FamilyPillar;
  admissions: AdmissionResponse[];
  status: string;
  decisionState: BundleDecisionState;
  createdAt: string;
}
```

---

## 3. Flux d'onboarding complet

```
1. POST /bundles                    → Créer le dossier famille
2. POST /bundles/{id}/children      → Ajouter enfant 1
3. POST /bundles/{id}/children      → Ajouter enfant 2 (si plusieurs)
4. PATCH /{admissionId}/pillars/identity   → Compléter les données enfant
5. PATCH /bundles/{bundleId}/pillars/family → Compléter les données famille
6. POST /bundles/{bundleId}/submit  → Soumettre tout le bundle
          ↓
   (L'école traite — le parent consulte le tracker)
          ↓
7. GET /bundles/{bundleId}?accessCode=XXX  → Polling état décisionnel
          ↓
   Selon decisionState :
   • PAYMENT_REQUIRED → Rediriger vers billing
   • PARENT_CHOICE    → Afficher choix binaire
   • CLOSED           → Afficher état final
```

---

## 4. Référence API complète

### 4.1 Créer le dossier famille

```
POST /api/v1/public/admissions/bundles
Content-Type: application/json
X-Tenant-Id: <tenantId>
```

**Body :**
```json
{
  "tenantId": "550e8400-e29b-41d4-a716-446655440000",
  "family": {
    "primaryGuardian": {
      "firstName": "Amadou",
      "lastName": "Diallo",
      "phone": "+221771234567",
      "email": "amadou.diallo@email.com",
      "relation": "FATHER"
    },
    "customFields": {
      "homeAddress": "Cité Keur Gorgui, Dakar"
    }
  }
}
```

**Réponse `201 Created` :**
```json
{
  "id": "a1b2c3d4-...",
  "reference": "FAM-2026-XYZ",
  "accessCode": "A3F9",
  "family": { ... },
  "admissions": [],
  "status": "DRAFT",
  "decisionState": "AWAITING_SCHOOL",
  "createdAt": "2026-04-18T10:00:00Z"
}
```

> **Stocker immédiatement** `id` et `accessCode` en localStorage — sans eux, le parent ne peut plus accéder à son dossier.

---

### 4.2 Ajouter un enfant

```
POST /api/v1/public/admissions/bundles/{bundleId}/children
Content-Type: application/json
X-Tenant-Id: <tenantId>
```

**Body :**
```json
{
  "firstName": "Moussa",
  "lastName": "Diallo",
  "gender": "MALE",
  "type": "NEW_ENROLLMENT",
  "academicYearId": "current",
  "levelId": "TEMP",
  "filiereId": "TEMP",
  "cycleType": "COLLEGE"
}
```

**Réponse `201 Created` :** `AdmissionResponse`

> Appeler cet endpoint une fois par enfant. Chaque appel retourne une `AdmissionResponse` avec un `id` (admissionId) à stocker pour les étapes suivantes.

---

### 4.3 Mettre à jour les données d'un enfant (pilier dynamique)

```
PATCH /api/v1/public/admissions/{admissionId}/pillars/{pillarKey}
Content-Type: application/json
X-Tenant-Id: <tenantId>
```

**`pillarKey` disponibles :** `identity` | `medical` | `schooling`

**Exemple — pilier identity :**
```json
{
  "firstName": "Moussa",
  "lastName": "Diallo",
  "gender": "MALE",
  "birthDate": "2015-03-22",
  "birthPlace": "Dakar",
  "nationality": "Sénégalaise"
}
```

**Réponse `204 No Content`**

---

### 4.4 Mettre à jour les données famille (pilier bundle)

```
PATCH /api/v1/public/admissions/bundles/{bundleId}/pillars/{pillarKey}
Content-Type: application/json
X-Tenant-Id: <tenantId>
```

**`pillarKey` disponible :** `family`

**Body :**
```json
{
  "primaryGuardian": {
    "firstName": "Amadou",
    "lastName": "Diallo",
    "phone": "+221771234567",
    "email": "amadou.diallo@email.com",
    "relation": "FATHER"
  },
  "customFields": {
    "homeAddress": "Cité Keur Gorgui, Dakar"
  }
}
```

**Réponse `204 No Content`**

---

### 4.5 Soumettre le bundle (toute la famille d'un coup)

```
POST /api/v1/public/admissions/bundles/{bundleId}/submit
X-Tenant-Id: <tenantId>
```

**Réponse `200 OK` :** `AdmissionBundleResponse` avec tous les enfants en `SUBMITTED`

---

### 4.6 Consulter l'état du bundle (tracker parent)

```
GET /api/v1/public/admissions/bundles/{bundleId}?accessCode={accessCode}
X-Tenant-Id: <tenantId>
```

**Réponse `200 OK` :** `AdmissionBundleResponse`

> Utiliser pour le **polling** (ex: toutes les 30 secondes) afin de détecter le passage à `PAYMENT_REQUIRED` ou `PARENT_CHOICE`.

**Exemple de réponse avec mix admis/refusés :**
```json
{
  "id": "a1b2c3d4-...",
  "reference": "FAM-2026-XYZ",
  "accessCode": "A3F9",
  "decisionState": "PARENT_CHOICE",
  "admissions": [
    {
      "id": "...",
      "reference": "ADM-2026-001",
      "status": "ADMITTED",
      "trackerMessage": "Candidat admis ! Merci de confirmer l'inscription sur votre portail."
    },
    {
      "id": "...",
      "reference": "ADM-2026-002",
      "status": "REJECTED",
      "trackerMessage": "Désolé, le dossier n'a pas été retenu."
    }
  ]
}
```

---

### 4.7 Tracker individuel (par référence)

```
GET /api/v1/public/admissions/{reference}/track?accessCode={accessCode}
X-Tenant-Id: <tenantId>
```

**Réponse `200 OK` :** `AdmissionResponse`

---

### 4.8 Mes dossiers (par email)

```
GET /api/v1/public/admissions/mine?email={email}
X-Tenant-Id: <tenantId>
```

**Réponse `200 OK` :** `AdmissionResponse[]`

---

## 5. Endpoints de décision bundle

> Ces endpoints ne sont actifs que si `decisionState` est dans le bon état. Le serveur retourne `409` si la garde n'est pas respectée.

---

### 5.1 Option A — Tous admis → Confirmer les admis (déclenche paiement)

**Condition :** `decisionState === 'PAYMENT_REQUIRED'`

```
POST /api/v1/public/admissions/bundles/{bundleId}/confirm-admitted
Content-Type: application/json
X-Tenant-Id: <tenantId>
```

**Body :**
```json
{
  "accessCode": "A3F9"
}
```

**Réponse `200 OK` :** `AdmissionBundleResponse`  
- Tous les enfants `ADMITTED` reçoivent une `admissionDeadline`
- Un event `ADMISSION_PAYMENT_REQUESTED` est publié vers le billing-service
- Le parent est redirigé vers le tunnel de paiement

---

### 5.2 Option B — Mix admis/refusés → Valider les admis seulement

**Condition :** `decisionState === 'PARENT_CHOICE'`

```
POST /api/v1/public/admissions/bundles/{bundleId}/confirm-admitted
Content-Type: application/json
X-Tenant-Id: <tenantId>
```

**Body :**
```json
{
  "accessCode": "A3F9"
}
```

**Réponse `200 OK` :** `AdmissionBundleResponse`  
- Les enfants `ADMITTED` : deadline de paiement déclenchée  
- Les enfants `REJECTED` : inchangés

> **Note :** C'est le même endpoint que l'Option A — le serveur détecte automatiquement si on est en `PAYMENT_REQUIRED` ou `PARENT_CHOICE` et applique la bonne logique.

---

### 5.3 Option B — Tout annuler ("tout ou rien")

**Condition :** `decisionState === 'PARENT_CHOICE'` ou `'PAYMENT_REQUIRED'`

```
POST /api/v1/public/admissions/bundles/{bundleId}/cancel-all
Content-Type: application/json
X-Tenant-Id: <tenantId>
```

**Body :**
```json
{
  "accessCode": "A3F9"
}
```

**Réponse `200 OK` :** `AdmissionBundleResponse`  
- Tous les enfants `ADMITTED` passent en `CANCELLED`  
- Les enfants `REJECTED` restent `REJECTED`  
- `decisionState` → `CLOSED`

---

### 5.4 Annuler un seul enfant

```
POST /api/v1/public/admissions/{admissionId}/cancel
X-Tenant-Id: <tenantId>
```

**Réponse `204 No Content`**

---

## 6. Logique d'affichage — Écran de décision

```typescript
function renderDecisionScreen(bundle: AdmissionBundleResponse) {
  switch (bundle.decisionState) {

    case 'AWAITING_SCHOOL':
      // Afficher timeline avec statuts par enfant
      // Proposer un polling (ex: rafraîchissement toutes les 30s)
      break;

    case 'PAYMENT_REQUIRED':
      // Tous les enfants sont ADMITTED
      // Afficher le résumé + bouton "Procéder au paiement"
      // → POST /confirm-admitted puis rediriger vers billing
      break;

    case 'PARENT_CHOICE':
      // Mix : certains ADMITTED, certains REJECTED
      // Afficher la liste avec statut par enfant
      // Bouton 1 : "Valider les admis et payer" → POST /confirm-admitted
      // Bouton 2 : "Tout annuler" → POST /cancel-all
      // Expliquer clairement que le choix est irréversible
      break;

    case 'CLOSED':
      // Tous les dossiers ont une issue finale
      // Afficher un récap (validés, refusés, annulés)
      // Aucun bouton d'action
      break;
  }
}
```

---

## 7. Codes d'erreur

| Code HTTP | Signification | Action frontend |
|---|---|---|
| `400` | Données invalides (validation) | Afficher les erreurs de champ |
| `401` | Token manquant/invalide | Rediriger vers login (pour les routes protégées) |
| `403` | Accès interdit (accessCode incorrect) | Afficher "Code d'accès invalide" |
| `404` | Bundle ou admission introuvable | Afficher "Dossier introuvable" |
| `409` | Transition d'état invalide (ex: décision sur bundle pas prêt) | Afficher "Action non autorisée pour l'état actuel" |
| `500` | Erreur serveur | Afficher message générique + retry |

---

## 8. Codes d'état enfant — Messages lisibles

| `status` | `trackerMessage` (retourné par l'API) |
|---|---|
| `DRAFT` | Saisie en cours... |
| `SUBMITTED` | Dossier soumis, en attente de vérification par le secrétariat. |
| `VERIFIED` | Dossier vérifié et conforme. Candidat autorisé à passer le test. |
| `TESTING` | Évaluation pédagogique en cours. |
| `ADMITTED` | Candidat admis ! Merci de confirmer l'inscription sur votre portail. |
| `WAITLIST` | Candidat admis pédagogiquement. En attente d'une place disponible. |
| `VALIDATED` | Félicitations ! Admission validée définitivement. |
| `REJECTED` | Désolé, le dossier n'a pas été retenu. |
| `CANCELLED` | Dossier annulé. |

> Le champ `trackerMessage` est déjà localisé en français côté serveur — l'afficher directement sans retraitement côté Angular.

---

## 9. Persistance locale recommandée (localStorage)

```typescript
interface LocalBundleSession {
  bundleId: string;
  accessCode: string;
  tenantId: string;
  reference: string;
}

// Clé : 'feewi_bundle_session'
// À supprimer après que decisionState passe à CLOSED ou VALIDATED
```
