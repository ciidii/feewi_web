# Backlog — Intégration frontend du module Enrollment

> Audit du 2026-07-11 : parcours complet de `src/app/domains/school-app/features/enrollment/` (`enrollment-detail`, `enrollment-list`, `re-enrollment`), `core/services/enrollment-admin.service.ts`, `core/services/enrollment-public.service.ts` et `core/models/enrollment/*`, comparé aux changements backend livrés dans `enrollment-service` (voir `feewi/contexte/enrollment/BACKLOG.md` — BL-ENR-01 à 04).

## Légende priorités

| Priorité | Signification |
|---|---|
| 🔴 P0 | Chemin UI existant qui va désormais échouer à cause du changement backend, sans solution de contournement dans l'UI |
| 🟡 P2 | Écart mineur, additif non-bloquant, ou pré-existant sans lien avec les changements backend récents |

---

## 🔴 BL-FE-ENR-01 — Aucun moyen de confirmer le paiement : "Validation Finale" va systématiquement échouer

**Constat** : depuis BL-ENR-01 (backend), `Admission.validate()` refuse (`409`) toute transition vers `VALIDATED` si `paymentConfirmed == false`. Or :
- `Admission` (frontend, `core/models/enrollment/entities.ts`) n'expose pas `paymentConfirmed`/`paymentConfirmedBy`/`paymentConfirmedAt`.
- `EnrollmentAdminService` n'a aucune méthode pour appeler le nouvel endpoint `PATCH /admin/admissions/{id}/payment/confirm`, et `api-endpoints.ts` ne déclare pas ce chemin.
- `enrollment-detail.component.ts` : `isReadyForFinalValidation()` ne vérifie que les documents obligatoires, pas le paiement — le bouton "Validation Finale" reste actif et cliquable alors que l'appel échouera **à chaque fois** tant qu'aucun paiement n'a été confirmé manuellement (aucun `billing-service` n'existe, ce flag est donc la seule voie).
- Le seul contournement visible seraitle bouton "Dérogation" (`overruleAdmission`), mais il court-circuite *tous* les garde-fous (quota, documents), pas seulement le paiement — sémantiquement incorrect pour un usage routinier.
- Même écart sur l'action rapide "Valider" de `enrollment-list.component.ts` (`handleQuickValidate`).

**Ce qu'il reste à faire** :
1. Ajouter `paymentConfirmed?: boolean`, `paymentConfirmedBy?: string`, `paymentConfirmedAt?: string` à `Admission` (`entities.ts`).
2. Ajouter `CONFIRM_PAYMENT: (id: string) => \`/admin/admissions/${id}/payment/confirm\`` dans `api-endpoints.ts` (section `ENROLLMENT.ADMIN`).
3. Ajouter `confirmPayment(admissionId: string): Observable<void>` à `EnrollmentAdminService`.
4. `enrollment-detail.component.ts` : ajouter `canConfirmPaymentAction` (permission `enrollment:admission:confirm-payment`), une méthode `confirmPayment()` (dialogue de confirmation), et faire dépendre `isReadyForFinalValidation()` de `app.paymentConfirmed` en plus des documents.
5. Template : bouton "Confirmer le paiement" visible quand `canValidate() && !app.paymentConfirmed`, + badge de statut paiement (confirmé/en attente) dans le header.
6. Role Designer (`role-designer.component.ts`) : ajouter le libellé `'confirm-payment': 'Confirmer paiement'` à `ACTION_LABELS` pour un affichage correct de la nouvelle permission.

**Hors scope de ce ticket** : la colonne/quick-action de `enrollment-list.component.ts` n'expose pas `paymentConfirmed` dans son DTO résumé (`AdmissionAdminResponse`) — l'action rapide "Valider" en liste continuera d'échouer avec le message d'erreur backend (correct, `enrollment-service` a un `GlobalExceptionHandler`) mais sans indicateur visuel préalable. Ajouter cette colonne serait un changement de plus grande ampleur (liste + DTO), non traité ici.

**Effort estimé** : 2–3 h

---

## 🟡 BL-FE-ENR-02 — `reasonCode` (réinscription) non consommé par le frontend

**Constat** : BL-ENR-04 (backend) a ajouté `reasonCode` (enum stable) à `GET /public/admissions/re-enroll/eligibility`, en complément additif de `reason` (texte libre, inchangé). `ReEnrollEligibilityResponse` (frontend) ne déclare que `reason`, et `re-enrollment.component.ts` (ligne 161) affiche `eligibility.reason` — ce qui **continue de fonctionner** puisque le champ texte n'a pas changé. Aucune régression, seulement une opportunité non exploitée (le but du `reasonCode` étant justement d'éviter le matching fragile sur texte libre, cf. `USECASES-reinscription.md`).

**Ce qu'il reste à faire** : ajouter `reasonCode?: string` à `ReEnrollEligibilityResponse` (type-complétude). Pas de changement de comportement UI nécessaire tant que le texte français reste acceptable à afficher tel quel.

**Effort estimé** : 5 min (typage uniquement)

---

## 🟡 BL-FE-ENR-03 — Observations pré-existantes, sans lien avec les changements backend récents (non corrigées)

- `enrollment-detail.component.ts` définit une méthode `cancelAdmission()` complète (dialogue + appel service), mais **aucun bouton du template ne l'appelle** — code mort, présent avant cette session. Sans rapport avec BL-ENR-03 (backend), qui ne fait qu'ajouter un garde-fou serveur à un endpoint déjà appelé ailleurs (liste, bulk).
- `enrollment-list.component.ts` → `handleBulkDelete()` utilise `forkJoin` sur les annulations : si un seul dossier du lot est déjà `VALIDATED`/`REJECTED` (nouveau `409` depuis BL-ENR-03), le message reste générique ("Certains dossiers n'ont pas pu être annulés"), sans indiquer lesquels. Comportement pré-existant du pattern `forkJoin` (pas un changement introduit par le garde-fou serveur), non repris ici.

**Ce qu'il reste à faire** : rien de prescrit — signalé pour visibilité, à traiter séparément si souhaité.

---

## Récapitulatif

| # | Ticket | Priorité | Effort | Statut |
|---|---|---|---|---|
| BL-FE-ENR-01 | Confirmation de paiement absente côté frontend | 🔴 P0 | 2–3 h | ✅ implémenté et vérifié |
| BL-FE-ENR-02 | `reasonCode` non typé côté frontend | 🟡 P2 | 5 min | ✅ implémenté (typage) |
| BL-FE-ENR-03 | Observations diverses (code mort, forkJoin) | 🟡 P2 | — | ℹ️ non traité (hors scope) |

## Implémentation (2026-07-11)

- `entities.ts` : `Admission` expose désormais `paymentConfirmed?: boolean`, `paymentConfirmedBy?: string`, `paymentConfirmedAt?: string`.
- `dtos.ts` : `ReEnrollEligibilityResponse.reasonCode` (union typée des 6 valeurs backend).
- `api-endpoints.ts` : `ENROLLMENT.ADMIN.CONFIRM_PAYMENT(id)`.
- `enrollment-admin.service.ts` : `confirmPayment(admissionId)`.
- `enrollment-detail.component.ts` : `canConfirmPaymentAction`, `confirmPayment()` (dialogue de confirmation), `isReadyForFinalValidation()` exige désormais `app.paymentConfirmed` en plus des documents.
- `enrollment-detail.component.html/.scss` : badge de statut paiement (`payment-status-chip`, ambre/vert) + bouton "Confirmer le paiement", visibles uniquement quand `canValidate()` est vrai (ADMITTED/WAITLIST + évaluation faite).
- `role-designer.component.ts` : libellé `ACTION_LABELS['confirm-payment'] = 'Confirmer paiement'`.

## Vérification (2026-07-11)

- `tsc --noEmit` et `ng build` propres.
- Dossier de test créé en conditions réelles via le portail public (`POST /public/admissions/bundles` → `.../children`), tenant `all-cycle` (démo, 0 dossier existant).
- Appel direct `PATCH /admin/admissions/{id}/payment/confirm` (JWT réel `admin@fulltest.sn`) → **204**, et `GET .../details` confirme la persistance exacte : `paymentConfirmed:true, paymentConfirmedBy:"admin@fulltest.sn", paymentConfirmedAt:"..."` — **le contrat JSON réel correspond exactement** aux champs ajoutés au modèle frontend.
- Page de détail chargée dans le navigateur pour ce dossier (statut `DRAFT`) : aucune erreur console, rendu correct, et le badge de paiement est **correctement absent** (le dossier n'est pas encore `ADMITTED`/`WAITLIST` avec évaluation — gating attendu, pas un bug).
- **Non testé de bout en bout** : je n'ai pas pu pousser un dossier jusqu'à `ADMITTED` pour voir le badge/bouton apparaître en direct — bloqué par un bug backend pré-existant sans rapport (voir ci-dessous). La logique d'affichage (`canValidate() && !app.paymentConfirmed`) reste donc vérifiée par relecture de code + build, pas par clic réel.

## 🐛 Bug backend pré-existant découvert (hors scope, signalé sans correction)

`AdmissionAdminController.fastEntry()` (`POST /admin/admissions/direct`, saisie guichet) ne copie jamais `birthDate`/`birthPlace` de `request.getIdentity()` vers `AddChildRequest` avant d'appeler `createUseCase.addChildToBundle()` — la date de naissance est donc toujours `null`, et la création échoue systématiquement avec `409 "La date de naissance est obligatoire."`. Confirmé en direct (curl direct sur `enrollment-service`). Sans rapport avec BL-ENR-01..04 ni ce backlog frontend — bug de saisie directe pré-existant, non corrigé ici, à ajouter séparément au backlog backend `contexte/enrollment/BACKLOG.md` si prioritaire.
