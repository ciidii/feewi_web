# Backlog — Intégration frontend du module Academic

> Audit du 2026-07-11 : parcours complet de `src/app/domains/school-app/features/academic/`, `core/services/academic.service.ts`, `core/models/academic.model.ts`, `core/models/notification.model.ts`, `core/services/in-app-notification.service.ts` et `identity/role-designer/`, comparé aux changements backend livrés dans `academic-structure-service` (voir `feewi/contexte/academic/BACKLOG.md`). Objectif : identifier précisément ce qui est déjà câblé côté frontend et ce qui ne l'est pas.

## Légende priorités

| Priorité | Signification |
|---|---|
| 🔴 P0 | Fonctionnalité backend livrée, aucune UI ne l'utilise — invisible pour l'utilisateur |
| 🟠 P1 | Bug d'intégration réel constaté (pas une fonctionnalité manquante) |
| 🟡 P2 | Amélioration UX / polish |

---

## 🔴 BL-FE-ACAD-01 — `AcademicService` n'a aucune méthode pour `/validate`, `/roster`

**Constat** : `core/services/academic.service.ts` (490 lignes) couvre `getWaitingAssignments`, `assignStudent`, `unassignStudent`, `getAssignmentsByClass`, `getAssignmentSummary` — mais **aucune méthode** n'appelle `POST/DELETE /assignments/validate` ni `GET /assignments/roster/{classId}` (nouveaux endpoints backend, `contexte/academic/BACKLOG.md` BL-ACAD-01/02). Le socle HTTP est absent, pas seulement l'UI.

**Ce qu'il reste à faire** :
1. Ajouter à `AcademicService` : `validateAssignments(yearId, levelId)`, `unlockAssignments(yearId, levelId)`, `getRoster(classId): Observable<StudentAssignment[]>`.
2. Étendre `AssignmentSummary` (`core/models/academic.model.ts`) si le backend expose un jour un indicateur de verrouillage (voir BL-FE-ACAD-07 ci-dessous — actuellement impossible à savoir sans tenter l'action).

**Effort estimé** : 1 h

---

## 🔴 BL-FE-ACAD-02 — Pas d'action de verrouillage dans la "Vue Direction"

**Constat** : `student-assignment.component.ts` a déjà un onglet `direction` (`canSupervise`, permission `academic:assignment:supervise`) qui affiche le résumé (`getAssignmentSummary`) — **strictement en lecture seule**. Aucun bouton "Valider les affectations" n'existe pour appeler le nouvel endpoint de verrouillage.

**Ce qu'il reste à faire** :
1. Dans l'onglet Direction, ajouter un bouton "Valider les affectations de ce niveau" par ligne du résumé, gardé par une nouvelle permission `academic:assignment:validate` (`hasPermission`).
2. Après un `409` sur `assignStudent`/`unassignStudent` (déjà catché dans `onAssign`, message générique "La classe est déjà complète" — **à corriger** : un 409 peut aussi venir du verrou, message actuellement trompeur), afficher un message distinct si la cause est le verrouillage plutôt que la capacité (nécessite de distinguer les deux causes via le corps de l'erreur, pas juste le code HTTP).
3. Bouton de déverrouillage symétrique, réservé à la même permission.

**Effort estimé** : 3–4 h

---

## 🔴 BL-FE-ACAD-03 — Aucune page "roster" pour l'enseignant

**Constat** : recherche exhaustive (`TEACHER`, `mes-classes`, `my-classes`) — **aucune page dédiée à l'enseignant** n'existe dans `school-app/features`. La nouvelle permission `academic:roster:read` (destinée au preset Enseignant) n'a donc aucun consommateur : même une fois le rôle configuré côté `identity-service`, l'enseignant n'aurait nulle part où l'exercer.

**Ce qu'il reste à faire** : cadrage à part entière, pas un simple ticket — nécessite une nouvelle route + composant (liste des classes de l'enseignant, puis roster par classe). Effort largement supérieur aux autres tickets de ce fichier ; à ne pas sous-estimer en le traitant comme un "ajout mineur".

**Effort estimé** : non chiffré ici — cadrage dédié recommandé (nouvelle feature, pas une correction)

---

## 🟠 BL-FE-ACAD-04 — `unassignStudent()` existe côté service mais n'est appelé nulle part

**Constat** : `AcademicService.unassignStudent()` existe (probablement depuis avant cette session). Mais `class-detail.component.ts` (`handleStudentAction`, action `remove`) affiche seulement `this.notificationService.info("Désaffectation bientôt disponible.")` — **la méthode n'est jamais invoquée**. Ce n'est pas un gap introduit par les changements backend de cette session, mais il bloque directement la nouvelle notification `CLASS_UNASSIGNED` (BL-STUD-04/BL-NOTIF-02, déjà livrées backend) : sans appel réel à `/unassign`, cette notification ne peut jamais se déclencher depuis l'UI.

**Ce qu'il reste à faire** :
1. Brancher `handleStudentAction('remove')` sur `academicService.unassignStudent(assignment.id)`, avec confirmation (dialog) avant l'appel — cohérent avec le pattern `MatDialogModule` déjà importé dans ce composant.
2. Gérer le retour (succès → `refresh()` + toast ; `409` si niveau verrouillé, voir BL-FE-ACAD-02).

**Effort estimé** : 1–2 h

---

## 🟠 BL-FE-ACAD-05 — `NotificationType` frontend désynchronisé de l'enum backend

**Constat** : `core/models/notification.model.ts` définit `NotificationType` = `ADMISSION_SUBMITTED | ADMISSION_VALIDATED | PAYMENT_RECEIVED | PAYMENT_REQUESTED | CLASS_ASSIGNED | GENERAL_INFO | URGENT_ALERT`. L'enum réel backend (`notification-service`, post-session) est `ADMISSION_SUBMITTED, ADMISSION_VALIDATED, ADMISSION_REJECTED, ADMISSION_WAITLISTED, PAYMENT_REQUESTED, PAYMENT_DUE_REMINDER, OFFER_EXPIRED, GENERAL_INFO, CLASS_ASSIGNED, CLASS_UNASSIGNED`. Écarts :
- **Manquants côté frontend** (donc sans icône/libellé/route dédiés, fallback générique `Bell` sans `routePattern` dans `getMetadata()`) : `CLASS_UNASSIGNED` **(nouveau, directement lié au module academic)**, `ADMISSION_REJECTED`, `ADMISSION_WAITLISTED`, `PAYMENT_DUE_REMINDER`, `OFFER_EXPIRED`.
- **Présents côté frontend mais inexistants côté backend** : `PAYMENT_RECEIVED`, `URGENT_ALERT` (types morts ou aspirationnels).

**Ce qu'il reste à faire (scope academic uniquement)** :
1. Ajouter `'CLASS_UNASSIGNED'` à `NotificationType`.
2. Ajouter une entrée dans `METADATA_REGISTRY` (`in-app-notification.service.ts`) : label "Retrait de classe", icône (ex. `UserMinus`), `routePattern: '/admin/academic/classes/:id'` (même pattern que `CLASS_ASSIGNED`).
3. Les 4 autres types manquants (`ADMISSION_REJECTED`, `ADMISSION_WAITLISTED`, `PAYMENT_DUE_REMINDER`, `OFFER_EXPIRED`) concernent le module enrollment — hors scope de ce fichier, à traiter dans un futur `ENROLLMENT-FRONTEND-BACKLOG.md`.

**Effort estimé** : 30 min (scope academic)

---

## 🟠 BL-FE-ACAD-06 — Bug confirmé : collision de permissions dans le Role Designer

**Constat vérifié dans le code** : `role-designer.component.ts`, méthode `groupPermissionsToMatrix()`. Chaque permission est classée en `read`/`write`/`delete`/`special` selon son suffixe d'action ; tout ce qui ne matche pas `read/list/view`, `write/create/add/submit/assess`, ou `delete/remove/cancel` tombe dans l'unique case `special` **par ressource**, avec cette ligne :
```ts
if (!row.special) row.special = actionObj;
```
`academic:assignment:supervise` (déjà existante) et la nouvelle `academic:assignment:validate` partagent la **même ressource** (`assignment`) et tombent toutes les deux dans ce catch-all "special" — **une seule des deux survivra dans la matrice UI**, l'autre sera silencieusement invisible et donc impossible à assigner à un rôle. Confirmé en lisant le code, pas une supposition.

**Ce qu'il reste à faire** :
1. Remplacer `special?: PermissionAction` par `specials?: PermissionAction[]` dans `PermissionResourceRow`, et adapter le template (`role-designer` HTML) qui consomme `row.special` en boucle sur `row.specials`.
2. Ajouter une entrée `'roster': 'Roster de classe'` dans `RESOURCE_LABELS` (actuellement absente → `academic:roster:read` s'affiche sous le libellé brut `"ROSTER"`, en majuscules, non traduit).

**Effort estimé** : 2 h (le changement de modèle de données touche un composant transverse, à tester avec toutes les ressources multi-"special" existantes, pas seulement `assignment`)

---

## 🟡 BL-FE-ACAD-07 — Pas moyen de savoir si un niveau est verrouillé sans échouer d'abord

**Constat** : `GET /assignments/summary` (consommé par `getAssignmentSummary`) ne retourne aucun indicateur de verrouillage — le seul moyen de le découvrir est un `409` sur `/assign` ou `/unassign` (voir BL-FE-ACAD-02). Une fois le verrou posé, l'UI de la Vue Direction ne peut pas afficher un badge "Verrouillé" par niveau, ni désactiver proactivement le glisser-déposer (`onDrop`) vers ce niveau.

**Ce qu'il reste à faire** : **ticket croisé, pas purement frontend** — nécessite d'abord une petite extension côté `academic-structure-service` (`AssignmentSummaryResponse` += `locked: boolean`, ou un endpoint `GET /assignments/validate?academicYearId=&levelId=` dédié), puis affichage du badge et désactivation du drag-drop côté frontend une fois ce champ disponible.

**Effort estimé** : non chiffrable côté frontend seul — dépend d'abord d'un petit ticket backend

---

## Récapitulatif

| # | Ticket | Priorité | Effort | Statut |
|---|---|---|---|---|
| BL-FE-ACAD-01 | Méthodes `AcademicService` manquantes (validate/unlock/roster) | 🔴 P0 | 1 h | ✅ implémenté |
| BL-FE-ACAD-02 | Action de verrouillage absente de la Vue Direction | 🔴 P0 | 3–4 h | ✅ implémenté |
| BL-FE-ACAD-03 | Page roster enseignant inexistante | 🔴 P0 | non chiffré — cadrage dédié | ⏳ non traité (hors scope volontaire) |
| BL-FE-ACAD-04 | `unassignStudent()` jamais appelé (placeholder "bientôt disponible") | 🟠 P1 | 1–2 h | ✅ implémenté |
| BL-FE-ACAD-05 | `CLASS_UNASSIGNED` absent du modèle de notification frontend | 🟠 P1 | 30 min | ✅ implémenté |
| BL-FE-ACAD-06 | Collision `special` dans le Role Designer (bug confirmé) | 🟠 P1 | 2 h | ✅ implémenté |
| BL-FE-ACAD-07 | Pas d'indicateur de verrouillage dans `GET /summary` | 🟡 P2 | dépend d'un ticket backend | ⏳ non traité (dépend d'abord d'un ticket backend) |

**Total chiffrable réalisé** : ~8–10 h — **5 tickets sur 7 implémentés**. BL-FE-ACAD-03 et BL-FE-ACAD-07 restent hors scope, comme prévu dès le départ (respectivement : nouvelle feature à cadrer séparément, et dépendance à un ticket backend non encore écrit).

## Vérification (2026-07-11)

Testé en conditions réelles (stack complète relancée, connexion réelle, appels API réels — voir rapport `/verify`) :
- BL-FE-ACAD-01/02 : cycle verrouiller → doublon refusé → déverrouiller confirmé de bout en bout (curl direct + clic réel dans l'UI via `gstack browse`, dialog de confirmation, appel réseau visible).
- BL-FE-ACAD-06 : confirmé par extraction du DOM réel de `/admin/identity/roles` — `academic:assignment:supervise` et `academic:assignment:validate` s'affichent bien comme deux toggles distincts sous "Affectation Élèves" (la collision est résolue).
- BL-FE-ACAD-04 : le placeholder a disparu et le code est branché, mais pas cliqué de bout en bout faute d'élève assigné dans les données de démo.
- BL-FE-ACAD-05 : vérifié par la compilation (`ng build`) réussie du bundle notification ; pas de scénario interactif à cliquer (ajout de type/données).
- **Prérequis découvert en testant** : `academic:assignment:validate` et `academic:roster:read` sont des permissions neuves — il faut les accorder explicitement à un rôle (via Role Designer, ou `PUT /api/v1/roles/{id}`) avant de pouvoir les utiliser. Le cache de permissions de la gateway (15 min, documenté) retarde la prise d'effet après un octroi.
- **Bug d'environnement sans rapport** : la page `/saas/tenants` (et le shell partagé) a un décalage CSS qui rend certaines zones non cliquables nativement — dû à un refactor en cours non committé de `shell`/`page-shell`, pas à ces tickets.
