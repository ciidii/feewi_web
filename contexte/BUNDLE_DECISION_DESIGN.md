# Décision Parent sur Bundle Multi-Enfants — Design

> Statut : **Réflexion validée — en attente d'implémentation**  
> Contexte : un parent soumet plusieurs enfants dans un même bundle. L'école traite chaque enfant indépendamment. Quand tous les dossiers sont traités, le parent doit décider.

---

## Principe fondateur

> Le parent n'intervient sur le bundle qu'une seule fois,  
> quand **tous** les enfants ont atteint un état final côté école.

| Catégorie | Statuts | Raison |
|---|---|---|
| **En cours** (parent attend) | `SUBMITTED`, `VERIFIED`, `TESTING` | L'école traite encore |
| **Final** (école a décidé) | `ADMITTED`, `REJECTED`, `WAITLIST`, `VALIDATED`, `CANCELLED` | L'école a rendu sa décision — `WAITLIST` inclus : pédagogiquement OK mais sans place, l'évaluation est terminée |

---

## Les deux branches

### Option A — Cas nominal (tous admis)

```
Tous les enfants → ADMITTED
        │
        ▼
Notification parent + deadline de paiement
        │
   Parent paie
        │
        ▼
ADMITTED → VALIDATED  (automatique sur chaque enfant)
```

Pas de choix binaire — le parent paie simplement dans le délai imparti.

---

### Option B — Cas partiel (certains admis, d'autres rejetés)

```
Mix ADMITTED + REJECTED
        │
        ▼
Le parent choisit (une seule fois, action atomique sur le bundle) :

  Choix 1 — "Je valide les admis, tant pis pour les autres"
  → Les ADMITTED reçoivent une deadline de paiement
  → REJECTED reste REJECTED

  Choix 2 — "Tout ou rien — j'annule tout"
  → ADMITTED → CANCELLED
  → REJECTED reste REJECTED
```

---

## Règles métier

| # | Règle |
|---|---|
| R1 | Le parent ne peut agir que si **aucun** enfant n'est en `SUBMITTED`, `VERIFIED` ou `TESTING` |
| R2 | Tous `ADMITTED` → Option A (paiement direct, pas de choix binaire) |
| R3 | Mix `ADMITTED` + `REJECTED` → Option B (choix binaire obligatoire) |
| R4 | Tous `REJECTED` → bundle `CLOSED`, aucune action parent |
| R5 | `REJECTED` est immuable par le parent — décision de l'école |
| R6 | `VALIDATED` est immuable — enfant déjà inscrit |
| R7 | Le choix en Option B est **atomique** — s'applique à tout le bundle, pas enfant par enfant |
| R8 | La deadline de paiement est déclenchée à l'entrée en Option A **ou** au Choix 1 de l'Option B |

---

## Statut calculé du bundle (`BundleDecisionState`)

Enum de lecture uniquement — **jamais stocké en base**, calculé à la volée.

| Valeur | Condition | Signification |
|---|---|---|
| `AWAITING_SCHOOL` | Au moins 1 enfant en `SUBMITTED`, `VERIFIED` ou `TESTING` | Parent attend, aucune action possible |
| `PAYMENT_REQUIRED` | Tous finals, au moins 1 `ADMITTED`, aucun `REJECTED` | Option A — payer directement |
| `PARENT_CHOICE` | Tous finals, mix `ADMITTED`/`WAITLIST` + `REJECTED` | Option B — choix binaire |
| `CLOSED` | Tous `REJECTED` / `CANCELLED` / `VALIDATED` / `WAITLIST` seuls | Terminé, rien à faire |

> `WAITLIST` seul (sans aucun `ADMITTED`) → `CLOSED` : le parent ne peut qu'attendre qu'une place se libère, aucun choix binaire pertinent.

```java
public BundleDecisionState computeDecisionState() {
    boolean anyInProgress = admissions.stream().anyMatch(a ->
        Set.of(SUBMITTED, VERIFIED, TESTING).contains(a.getStatus()));
    if (anyInProgress) return AWAITING_SCHOOL;

    boolean anyAdmitted  = admissions.stream().anyMatch(a -> a.getStatus() == ADMITTED);
    boolean anyRejected  = admissions.stream().anyMatch(a -> a.getStatus() == REJECTED);
    boolean allClosed    = admissions.stream().allMatch(a ->
        Set.of(VALIDATED, REJECTED, CANCELLED, WAITLIST).contains(a.getStatus()));

    if (allClosed)                    return CLOSED;
    if (anyAdmitted && !anyRejected)  return PAYMENT_REQUIRED;  // Option A
    if (anyAdmitted && anyRejected)   return PARENT_CHOICE;     // Option B
    return CLOSED; // WAITLIST seul, tous rejetés
}
```

---

## API REST

```
# Option A — paiement (déclenché par billing-service ou manuellement)
POST /api/v1/public/admissions/bundles/{bundleId}/confirm-payment
Body : { "accessCode": "A3F9", "paymentRef": "PAY-001" }
→ ADMITTED → VALIDATED sur tous les enfants ADMITTED du bundle
→ Guard : decisionState doit être PAYMENT_REQUIRED

# Option B — Choix 1 : valider les admis et payer
POST /api/v1/public/admissions/bundles/{bundleId}/confirm-admitted
Body : { "accessCode": "A3F9" }
→ Déclenche la deadline de paiement sur les ADMITTED
→ REJECTED inchangé
→ Guard : decisionState doit être PARENT_CHOICE

# Option B — Choix 2 : tout annuler
POST /api/v1/public/admissions/bundles/{bundleId}/cancel-all
Body : { "accessCode": "A3F9" }
→ ADMITTED → CANCELLED
→ REJECTED inchangé
→ Guard : decisionState doit être PARENT_CHOICE ou PAYMENT_REQUIRED
```

---

## Modèle de données à modifier

| Entité | Changement |
|---|---|
| `Admission` | + `admissionDeadline: OffsetDateTime` — renseigné quand paiement déclenché |
| `AdmissionBundle` | Champ `status` stocké → **supprimé**, remplacé par `computeDecisionState()` |
| `EnrollmentConfig` | + `offerExpirationDays: Integer` — délai avant expiration (null = sans limite) |
| `EnrollmentConfig` | + `offerExpirationAction: OfferExpirationAction` — `AUTO_CANCEL` ou `ALERT_ONLY` |
| `BundleDecisionState` | Nouvel enum (lecture seule, non persisté) |

---

## Questions ouvertes (à trancher)

| # | Question | Impact |
|---|---|---|
| Q1 | ~~Que se passe-t-il si la deadline expire ?~~ **TRANCHÉ** — configurable par l'école via `EnrollmentConfig` (voir ci-dessous) | — |
| Q2 | ~~Le `WAITLIST` rentre-t-il dans Option A ou Option B ?~~ **TRANCHÉ** — `WAITLIST` est final (école a décidé pédagogiquement), compte dans `computeDecisionState()` mais n'entre pas dans le paiement immédiat | — |
| Q3 | ~~Où vit le paiement ?~~ **TRANCHÉ** — `billing-service` dédié (à créer). `enrollment-service` publie un event `ADMISSION_PAYMENT_REQUESTED`, `billing-service` prend le relais et publie `PAYMENT_CONFIRMED` en retour pour déclencher `VALIDATED` | — |
| Q4 | ~~Notification parent ?~~ **TRANCHÉ** — géré dans `enrollment-service` pour l'instant (email direct via SMTP). Migrera vers un `notification-service` dédié plus tard. Le code doit être isolé derrière un port `NotificationPort` pour faciliter la migration | — |
