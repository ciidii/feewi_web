# Enrollment Service — Workflow & API Reference (Frontend)

> Base URL (via gateway) : `http://localhost:8080/enrollment`  
> Toutes les routes admin nécessitent un header `Authorization: Bearer <token>`.  
> Les routes publiques n'exigent pas de token JWT (portail parent).

---

## Cycle de vie d'un dossier

```
                        ┌─────────────────────────────────────────────────┐
                        │              PORTAIL PARENT (public)            │
                        └───────────────────────┬─────────────────────────┘
                                                │
                        [POST /bundles]  +  [POST /bundles/{id}/children]
                                                │
                                                ▼
                                            ┌───────┐
                                            │ DRAFT │  ◄── saisie en cours
                                            └───┬───┘
                                                │ [POST /{id}/submit]
                                                │ [POST /bundles/{id}/submit]
                                                ▼
                                          ┌──────────┐
                                          │SUBMITTED │  ◄── en attente secrétariat
                                          └────┬─────┘
                                               │ [PATCH /admin/{id}/verify]
                                               ▼
                                          ┌──────────┐
                                          │ VERIFIED │  ◄── documents conformes
                                          └────┬─────┘
                                               │ (automatique si assessment activé)
                                               ▼
                                          ┌─────────┐
                                          │ TESTING │  ◄── évaluation pédagogique
                                          └────┬────┘
                          ┌────────────────────┤
                          │ auto (si décision  │ [PATCH /direction/{id}/admit]
                          │ dans assessment)   │ (manuel, si pas de seuil)
                          ▼                   ▼
                     ┌──────────┐        ┌──────────┐
                     │REJECTED  │        │ ADMITTED │  ◄── offre faite, attend parent
                     └──────────┘        └────┬─────┘
                                              │ [PATCH /direction/{id}/validate]
                                              ▼
                                         ┌──────────┐
                          ┌──────────────│VALIDATED │  ◄── admission définitive
                          │ WAITLIST ───►└──────────┘
                          │
                          │ [PATCH /direction/{id}/waitlist]
                          │ (depuis ADMITTED, si plus de place)

À tout moment : [POST /{id}/cancel]  →  CANCELLED
```

---

## Messages affichés au parent (trackerMessage)

| Statut | Message |
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

---

## Endpoints — Portail Parent (public)

### Bundles (dossier famille)

| Méthode | URL | Description | Auth |
|---|---|---|---|
| `POST` | `/api/v1/public/admissions/bundles` | Créer le dossier familial | Non |
| `GET` | `/api/v1/public/admissions/bundles/{bundleId}?accessCode=` | Consulter le dossier famille | Non |
| `POST` | `/api/v1/public/admissions/bundles/{bundleId}/children` | Ajouter un enfant au dossier | Non |
| `PATCH` | `/api/v1/public/admissions/bundles/{bundleId}/pillars/{pillarKey}` | Modifier un pilier du bundle (famille) | Non |
| `POST` | `/api/v1/public/admissions/bundles/{bundleId}/submit` | Soumettre tout le bundle d'un coup | Non |

### Admissions (dossier enfant)

| Méthode | URL | Description | Auth |
|---|---|---|---|
| `PATCH` | `/api/v1/public/admissions/{id}/pillars/{pillarKey}` | Modifier un pilier de l'enfant | Non |
| `POST` | `/api/v1/public/admissions/{id}/documents/{docCode}` | Uploader un document (body = URL string) | Non |
| `PATCH` | `/api/v1/public/admissions/{id}/subscriptions` | Mettre à jour les services souscrits | Non |
| `POST` | `/api/v1/public/admissions/{id}/submit` | Soumettre le dossier d'un enfant | Non |
| `POST` | `/api/v1/public/admissions/{id}/cancel` | Annuler le dossier | Non |
| `GET` | `/api/v1/public/admissions/{reference}/track?accessCode=` | Tracker le statut (portail suivi) | Non |
| `GET` | `/api/v1/public/admissions/mine?email=` | Lister mes dossiers | Non |

### Ré-inscription

| Méthode | URL | Description | Auth |
|---|---|---|---|
| `POST` | `/api/v1/public/admissions/re-enroll` | Ré-inscrire un élève existant | Non |

---

## Endpoints — Secrétariat (admin)

Base : `/api/v1/admin/admissions`

| Méthode | URL | Description | Transition statut |
|---|---|---|---|
| `GET` | `/api/v1/admin/admissions` | Liste paginée avec filtres (`q`, `status`, `levelId`, `academicYearId`, `channel`) | — |
| `GET` | `/api/v1/admin/admissions/{id}/details` | Détail complet d'un dossier | — |
| `POST` | `/api/v1/admin/admissions/direct` | Saisie directe guichet (Walk-in) | → `SUBMITTED` |
| `PATCH` | `/api/v1/admin/admissions/{id}/verify` | Vérifier la conformité des documents | `SUBMITTED` → `VERIFIED` (puis `TESTING` si assessment activé) |
| `PATCH` | `/api/v1/admin/admissions/{id}/documents/{docName}/receive` | Marquer un document comme reçu physiquement | — |
| `PATCH` | `/api/v1/admin/admissions/{id}/assessment` | Saisir les notes / décision d'évaluation | `TESTING` → `ADMITTED` ou `REJECTED` (auto si seuil configuré) |
| `POST` | `/api/v1/admin/admissions/{id}/cancel` | Annuler un dossier (admin) | → `CANCELLED` |

---

## Endpoints — Direction

Base : `/api/v1/admin/direction/admissions`

| Méthode | URL | Description | Transition statut |
|---|---|---|---|
| `PATCH` | `/api/v1/admin/direction/admissions/{id}/admit` | Admettre manuellement (si pas de décision auto) | `TESTING` → `ADMITTED` |
| `PATCH` | `/api/v1/admin/direction/admissions/{id}/validate` | Valider l'admission définitivement | `ADMITTED` / `WAITLIST` → `VALIDATED` |
| `PATCH` | `/api/v1/admin/direction/admissions/{id}/overrule` | Valider par dérogation (passe le verrou numérique) | → `VALIDATED` |
| `PATCH` | `/api/v1/admin/direction/admissions/{id}/reject` | Rejeter le dossier (body = raison en string) | → `REJECTED` |
| `PATCH` | `/api/v1/admin/direction/admissions/{id}/waitlist` | Mettre en liste d'attente | → `WAITLIST` |
| `POST` | `/api/v1/admin/direction/admissions/bulk-validate` | Valider un lot (body = `["uuid1", "uuid2"]`) | `ADMITTED` → `VALIDATED` (en masse) |

---

## Payloads de référence

### POST `/bundles` — InitiateBundleRequest
```json
{
  "tenantId": "uuid-de-l-ecole",
  "family": {
    "primaryGuardian": {
      "firstName": "Mamadou",
      "lastName": "Diallo",
      "email": "mamadou@example.com",
      "phone": "+224620000000",
      "relationship": "FATHER"
    }
  }
}
```

### POST `/bundles/{id}/children` — AddChildRequest
```json
{
  "firstName": "Boubacar",
  "lastName": "Diallo",
  "gender": "MALE",
  "type": "NEW_ENROLLMENT",
  "academicYearId": "current",
  "levelId": "uuid-du-niveau"
}
```

### PATCH `/{id}/pillars/{pillarKey}` — Corps dynamique
```json
{
  "birthDate": "2015-03-21",
  "birthPlace": "Conakry",
  "nationality": "GN"
}
```
Valeurs possibles pour `pillarKey` : `identity`, `medical`, `schooling`, ou tout pilier libre défini par l'école.

### PATCH `/admin/{id}/assessment` — AssessmentRequest
```json
{
  "grades": {
    "Français": 14.5,
    "Mathématiques": 16.0,
    "Sciences": 12.0
  },
  "comments": "Bon profil, à suivre.",
  "decision": "ADMITTED",
  "recommendedLevelId": "uuid-du-niveau-recommandé"
}
```
`decision` : `ADMITTED` | `REJECTED` | `null` (laisser null pour décision automatique via seuil)

---

## Notes importantes pour le frontend

**Headers requis (routes admin)**
```
Authorization: Bearer <jwt>
X-Tenant-Id: <uuid-ecole>   ← uniquement sur GET /mine
```

**Verrou Numérique**
`validate` échoue si des documents obligatoires ne sont pas numérisés (`UPLOADED`).  
Utiliser `overrule` pour passer outre (Direction uniquement).

**Transition automatique TESTING → ADMITTED/REJECTED**
Quand l'établissement a configuré un `minPassingGrade`, la soumission de l'assessment (`PATCH /assessment`) calcule automatiquement la décision et fait avancer le statut sans intervention manuelle. Vérifier le champ `status` dans la réponse pour adapter l'UI.

**Pagination (GET /admin/admissions)**
Paramètres Spring Pageable : `?page=0&size=20&sort=createdAt,desc`
