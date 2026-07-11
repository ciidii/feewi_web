# Backlog — Intégration frontend des modules Notification & Document Engine

> Audit du 2026-07-11, dans la continuité de `ACADEMIC-FRONTEND-BACKLOG.md`, `STUDENT-FRONTEND-BACKLOG.md` et `ENROLLMENT-FRONTEND-BACKLOG.md`. Deux modules traités ensemble ici car les écarts trouvés sont ponctuels (notification) ou concentrés sur un seul écran (documents), contrairement aux modules précédents.

## Légende priorités

| Priorité | Signification |
|---|---|
| 🔴 P0 | Fonctionnalité backend livrée mais totalement inatteignable depuis l'UI |
| 🟠 P1 | Chemin UI existant qui affichera un rendu incorrect (vide/`undefined`) sans planter |

---

## 🟠 BL-FE-NOTIF-01 — Notification `ADMISSION_WAITLISTED` non reconnue par le frontend

**Constat** : BL-NOTIF-01 (backend) a ajouté `ADMISSION_WAITLISTED` à `NotificationType` et un consumer qui envoie une notification **IN_APP** au Secrétariat/Direction (symétrique à `ADMISSION_SUBMITTED`) — donc bien visible dans la cloche de notifications de l'app, pas seulement par email au parent. Côté frontend :
- `NotificationType` (`core/models/notification.model.ts`) ne déclarait pas cette valeur.
- `InAppNotificationService.METADATA_REGISTRY` n'avait pas d'entrée correspondante → `getMetadata()` retombe sur le fallback générique, qui **n'a pas de champ `label`** alors que `NotificationMetadata.label` est requis dans l'interface.
- `notification-popover.component.html:71` affiche `{{ getMeta(n.type).label }}` directement → pour toute notification `ADMISSION_WAITLISTED` reçue, ce libellé s'afficherait vide/`undefined` dans le popover, avec l'icône générique (`Bell`) au lieu d'une icône distinctive, et sans lien de navigation vers le dossier concerné.

**Corrigé** :
1. `ADMISSION_WAITLISTED` ajouté à `NotificationType`.
2. Entrée `METADATA_REGISTRY['ADMISSION_WAITLISTED']` (label "Admission", icône `Clock`, ambre, `routePattern: '/admin/enrollment/:id'`).
3. Fallback de `getMetadata()` complété avec `label: 'Notification'` — corrige le même risque pour n'importe quel type futur non mappé (defensive fix, même défaut que celui qui causait ce ticket).

**Statut** : ✅ implémenté.

---

## 🔴 BL-FE-DOC-01 — Étape "Prêt à remettre" (READY → DELIVERED) totalement absente de l'UI

**Constat** : BL-DOC-01/02/03 (backend) ont livré la génération réelle du PDF (`fileId` sur `DocumentRequest`), et un nouvel endpoint `PATCH /requests/{id}/deliver`. Côté frontend, `document-requests.component.ts` n'a **que deux onglets** : "À vérifier" (`PENDING`, éligibilité) et "À valider" (`ELIGIBLE`, approbation). **Aucune vue n'existe pour le statut `READY`** — une fois une demande approuvée (`approveRequest()` → `READY`), elle disparaît purement et simplement de l'écran : impossible de télécharger le PDF généré, impossible de la marquer `DELIVERED`. Toute la partie "remise du document" de SP6 (étapes 6-7), désormais livrée côté backend, était inatteignable depuis l'UI.
- `DocumentRequest` (frontend) n'exposait pas `fileId`.
- `DocumentRequestService` n'avait pas de méthode `deliver()`.
- `DocumentEngineService.getViewUrl(fileId)` existait déjà (réutilisé pour l'upload de pièces ailleurs) mais n'était appelé nulle part dans ce composant.

**Corrigé** :
1. `document.model.ts` : `DocumentRequest.fileId?: string`.
2. `document-request.service.ts` : `deliver(id): Observable<DocumentRequest>` → `PATCH /requests/{id}/deliver`.
3. `document-requests.component.ts` : nouvel onglet "Prêts" (`ready`, statut `READY`), gated par la permission `document:request:deliver` (même convention qu'un permission = un onglet, déjà en place pour les deux autres). Nouvelles actions `downloadDocument()` (ouvre `getViewUrl(fileId)` dans un nouvel onglet) et `deliverRequest()` (appelle `deliver()` puis recharge la liste).
4. `document-requests.component.html` : bloc de vue pour l'onglet `ready`, bouton "Télécharger" (désactivé si `fileId` absent — cas résiduel d'une demande approuvée avant ce correctif backend) + bouton "Marquer comme remis".

**Statut** : ✅ implémenté.

---

## Récapitulatif

| # | Ticket | Priorité | Statut |
|---|---|---|---|
| BL-FE-NOTIF-01 | Notification `ADMISSION_WAITLISTED` non reconnue | 🟠 P1 | ✅ implémenté |
| BL-FE-DOC-01 | Étape READY → DELIVERED absente de l'UI (téléchargement + remise) | 🔴 P0 | ✅ implémenté |

## Vérification (2026-07-11)

- `tsc --noEmit` et `ng build` propres.
- Page `/admin/documents/requests` chargée en direct : aucune erreur console, les **3 onglets** s'affichent ("À vérifier 0", "À valider 0", "Prêts 0") — le nouvel onglet "Prêts" est bien rendu par le composant.
- L'onglet "Prêts" apparaît **désactivé** pour l'utilisateur de test (`admin@fulltest.sn`) : la permission `document:request:deliver` (nouvelle, jamais accordée à aucun rôle) n'est pas encore assignée — comportement de garde-fou attendu (même mécanique que les deux autres onglets), pas un bug.
- **Non testé de bout en bout** : impossible de pousser une demande jusqu'à `READY` dans ce tenant de démo (`all-cycle`, 0 élève dans `student-registry-service` — `approveRequest` appelle désormais `student-registry-service` en Feign pour générer le PDF, qui échouerait sur un `studentId` inexistant). La vérification du bouton "Télécharger"/"Marquer comme remis" s'appuie donc sur la relecture du code (réutilisation de `DocumentEngineService.getViewUrl()`, déjà utilisé ailleurs dans l'app) plutôt que sur un clic réel bout-en-bout.
