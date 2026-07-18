# Backlog — Intégration frontend du module Student Registry

> Audit du 2026-07-11 : parcours complet de `src/app/domains/school-app/features/registry/` (`student-list`, `student-detail`, `student-edit-form`), `core/services/student-registry.service.ts` et `core/models/student.model.ts`, comparé aux changements backend livrés dans `student-registry-service` (voir `feewi/contexte/student/BACKLOG.md` — BL-STUD-01 à 04). Vérifié en conditions réelles (stack relancée, appels API réels) plutôt que par simple lecture.

## Légende priorités

| Priorité | Signification |
|---|---|
| 🔴 P0 | Chemin UI existant qui va désormais échouer à cause du changement backend, sans message clair |
| 🟠 P1 | Incohérence de modèle de données qui rend un correctif backend inopérant côté UI |
| 🟡 P2 | Limitation transverse déjà connue, conséquence côté frontend à documenter |

---

## 🔴 BL-FE-STUD-01 — Le formulaire d'édition offre encore "Archivé" comme statut, chemin désormais cassé

**Constat** : `student-detail.component.ts` a déjà une action `archiveStudent()` correcte (ligne 161), gardée par `status === 'LEFT'` + permission `student:registry:archive`, qui appelle le bon endpoint dédié `PATCH /students/{id}/archive`. **Mais** `student-edit-form.component.ts` (probablement atteint via un bouton "Modifier" séparé) a son propre champ `status` (`Validators.required`) dont les 4 options incluent directement **"Archivé (Ancien élève)"** (ligne 59), envoyé via le `PATCH /students/{id}` général (`updateStudent`).

Avant BL-STUD-01 (backend), ce chemin contournait silencieusement `canBeArchived()` — un bug de sécurité/intégrité. **Depuis BL-STUD-01**, ce même chemin échoue désormais : confirmé en direct (voir Vérification ci-dessous), le backend renvoie **500 sans aucun message exploitable** (voir BL-FE-STUD-03). Le formulaire propose donc une option qui échouera systématiquement, sans indiquer à l'utilisateur qu'il doit utiliser le bouton "Archiver" dédié de la fiche élève.

**Ce qu'il reste à faire** :
1. Retirer `'ARCHIVED'` de `statusOptions` dans `student-edit-form.component.ts` — seules `ACTIVE`/`SUSPENDED`/`LEFT` restent des transitions valides via ce formulaire général.
2. Si l'élève est déjà `ARCHIVED` à l'ouverture du formulaire, désactiver le formulaire entièrement (ou rediriger) — le backend refuse maintenant toute modification d'un dossier archivé, y compris `bloodGroup`/`criticalAllergies`.
3. Documenter dans l'UI (ex. texte d'aide) que l'archivage passe uniquement par le bouton dédié sur la fiche élève.

**Effort estimé** : 1 h

---

## 🟠 BL-FE-STUD-02 — `birthPlace`/`nationality` : le frontend n'utilise pas les champs que le backend vient de corriger

**Constat** : `student-edit-form.component.ts` envoie `nationality`/`birthPlace` **imbriqués dans `customFields`** (`customFields: { nationality, birth_place }`, notez le `birth_place` en snake_case) plutôt que comme champs de premier niveau `birthPlace`/`nationality` — qui sont pourtant des colonnes réelles et dédiées côté `Student` (backend). BL-STUD-01 (backend) a corrigé le bug où ces deux champs étaient acceptés par `UpdateStudentRequest` mais jamais persistés — **mais le frontend ne les envoie jamais sous cette forme**, donc cette correction backend reste actuellement inatteignable depuis cette UI. Par ailleurs, `UpdateStudentRequest`/`StudentResponse` (frontend, `student.model.ts`) n'exposent même pas `birthPlace`/`nationality` comme propriétés typées — seulement via `customFields` en `Record<string, any>` non typé.

**Ce qu'il reste à faire** :
1. Ajouter `birthPlace?: string` et `nationality?: string` à `StudentResponse` et `UpdateStudentRequest` (`student.model.ts`).
2. Dans `student-edit-form.component.ts`, envoyer `birthPlace`/`nationality` comme champs de premier niveau (pas dans `customFields`), et les précharger depuis `s.birthPlace`/`s.nationality` (pas `s.customFields?.['birth_place']`).
3. Vérifier s'il existe des données déjà écrites dans l'ancien format (`customFields.birth_place`) à migrer, ou si c'est resté un no-op silencieux jusqu'ici (probable, vu que rien ne les lisait nulle part ailleurs).

**Effort estimé** : 1–2 h

---

## 🟡 BL-FE-STUD-03 — Absence de `GlobalExceptionHandler` côté backend : confirmé en direct, tous les messages d'erreur sont perdus

**Constat vérifié en conditions réelles** : `curl` direct sur `student-registry-service` (élève inexistant) → `{"timestamp":...,"status":500,"error":"Internal Server Error","path":"..."}`, **sans champ `message`**. Déjà documenté comme écart backend dans `contexte/student/USECASES.md`/`BACKLOG.md` (aucun `@ControllerAdvice` dans ce service), mais pas encore un ticket backend planifié. Conséquence frontend concrète : `StudentRegistryService.handleError` (`error?.error?.message || message`) retombe **systématiquement** sur le message générique fixe ("Erreur lors de la mise à jour du dossier", etc.) — jamais sur un message métier précis, y compris pour BL-FE-STUD-01 ci-dessus.

**Ce qu'il reste à faire** : pas un ticket frontend en soi — le vrai correctif est d'ajouter un `GlobalExceptionHandler` à `student-registry-service` (à ajouter au backlog backend `contexte/student/BACKLOG.md`). En attendant, le frontend pourrait détecter certains cas au niveau du formulaire lui-même (BL-FE-STUD-01 empêche déjà le cas le plus fréquent en amont) plutôt que de compter sur le message serveur.

**Effort estimé** : non chiffrable côté frontend seul — dépend d'un ticket backend

---

## Récapitulatif

| # | Ticket | Priorité | Effort | Statut |
|---|---|---|---|---|
| BL-FE-STUD-01 | Retirer "Archivé" du formulaire d'édition général | 🔴 P0 | 1 h | ✅ implémenté |
| BL-FE-STUD-02 | Aligner `birthPlace`/`nationality` sur les vrais champs backend | 🟠 P1 | 1–2 h | ✅ implémenté |
| BL-FE-STUD-03 | Absence de messages d'erreur exploitables (dépend du backend) | 🟡 P2 | dépend d'un ticket backend | ⏳ non traité (ticket backend requis) |

**Total chiffrable réalisé** : ~2–3 h — **2 tickets sur 3 implémentés** (le 3ème dépend d'un ticket backend non encore écrit).

## Implémentation et vérification (2026-07-11)

- `student-edit-form.component.ts` : `statusOptions` réduit à `ACTIVE`/`SUSPENDED`/`LEFT` ; formulaire désactivé + message d'info si le dossier est déjà `ARCHIVED` à l'ouverture.
- `student.model.ts` : `birthPlace`/`nationality` ajoutés comme champs typés sur `StudentResponse`/`UpdateStudentRequest`.
- `student-edit-form.component.ts` + `student-detail.component.html` : lecture/écriture basculées sur ces champs de premier niveau, avec repli sur `customFields` pour les dossiers déjà écrits dans l'ancien format.
- Vérifié : `ng build` propre (templates compilés), et en direct dans le navigateur — le menu déroulant "Statut" n'affiche plus que 3 options (Actif/Suspendu/Sorti), "Archivé" a bien disparu.
- Non testé de bout en bout avec un vrai dossier (tenant de démo sans élève) — la vérification s'appuie sur la structure du formulaire rendu, pas sur un cycle complet charger/modifier/sauvegarder.

## Vérification (2026-07-11)

- Stack relancée, JWT réel obtenu (`admin@fulltest.sn` / tenant `all-cycle`).
- `GET /student/api/v1/students?page=0&size=5` → 200, 0 élève dans ce tenant de démo — impossible de cliquer le scénario BL-FE-STUD-01 de bout en bout (pas de dossier existant à archiver/modifier). Le constat s'appuie sur la lecture directe du code (`student-edit-form.component.ts` lignes 45-105), pas une supposition.
- `GET /student/api/v1/students/{id-inexistant}` → **500, corps sans `message`** — confirme précisément BL-FE-STUD-03 en conditions réelles, pas juste par lecture du code backend.

---

## 🔴 BUG-FE-STUD-04 — Lien sidebar "Dossiers scolaires" pointait vers une route inexistante → 500 backend

**Constat** : `sidebar.component.ts` (item `registryItems[1]`) liait "Dossiers scolaires" à `/admin/registry/students/records`. Aucune route Angular ne déclare `students/records` (`school-app.routes.ts` ne définit que `students`, `students/:id`, `students/:id/edit`) — le routeur matchait donc `records` contre la route générique `students/:id`, chargeant `StudentDetailComponent` avec `id = 'records'`. Celui-ci appelait `GET /students/records`, que le backend tentait de parser comme UUID, provoquant exactement l'exception rapportée : `MethodArgumentTypeMismatchException: ... Invalid UUID string: records`.

**Correctif** : la page liste dispose déjà d'un onglet "Quitté" (filtre `status=LEFT`), qui correspond sémantiquement à des "dossiers scolaires" (élèves ayant quitté l'établissement). Plutôt que de créer une page dédiée :
1. `sidebar.component.ts` : le lien "Dossiers scolaires" pointe maintenant vers `/admin/registry/students` avec `queryParams: { status: 'LEFT' }`.
2. `sidebar.component.html` (bloc registry) : ajout de `[queryParams]="item.queryParams"`, et `routerLinkActiveOptions` passé à `{exact: true}` pour les deux entrées (elles partagent désormais le même chemin, seul le query param diffère).
3. `student-list.component.ts` : `ngOnInit` s'abonne à `activatedRoute.queryParamMap` (pas juste un snapshot) — Angular réutilise l'instance du composant en naviguant entre les deux liens sidebar (même route, query param différent), donc un simple snapshot au premier `ngOnInit` aurait raté le changement. Le chargement des classes de référence a été extrait dans `loadClasses()`, découplé du chargement des élèves.

**Vérification en direct** : navigation via clic réel sur le lien sidebar (rail "Registre" → "Dossiers scolaires") → URL passe à `?status=LEFT`, onglet "Quitté" actif, requête réseau `GET /student/api/v1/students?page=0&size=20&status=LEFT → 200`, aucune erreur console, aucune requête vers `/records`.

**Statut** : ✅ corrigé et vérifié.
