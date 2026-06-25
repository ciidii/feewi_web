# 📑 Rapport d'Intégration : Module Admissions (Feewi Web)
**Date :** 31 Mars 2026
**État du dépôt :** Stable (Commit `20c2bad`)

## 1. ✅ Éléments Validés (Stables)

### Architecture Technique
*   **Migration Réactive :** Passage intégral aux Observables RxJS pour les services `Auth`, `Academic`, `EnrollmentAdmin` et `EnrollmentPublic`. Suppression des `async/await` et promesses.
*   **Gestion Multi-tenant :** Stabilisation de l'intercepteur HTTP pour la gestion dynamique des headers `X-Tenant-Id` et de l'injection propre du `Authorization: Bearer`.
*   **Sécurisation Environnement :** Restauration de la structure d'URLs originale (`apiUrl` + préfixes services) garantissant la compatibilité avec le proxy local.

### Console d'Administration (Pilotage)
*   **Pilotage Dynamique :** Implémentation de la console de configuration gérant les 3 Cercles (Disponibilité, Champs standards, Questions libres).
*   **Détail Dossier Premium :** Refonte visuelle complète (Design institutionnel), intégration du viewer de documents et de l'évaluation pédagogique dynamique.

### Portail Public (Parent)
*   **Workflow API v1.1 :** Stepper étendu à 6 étapes (Tuteur, Enfant, Spécifique, Services, Documents, Récapitulatif).
*   **Branding Ecole :** Affichage dynamique du logo et du nom de l'établissement via le `TenantContext`.
*   **Pilotage en Temps Réel :** Adaptation immédiate du formulaire dès la sélection du niveau (Cercle 2 et 3).

---

## 2. ⚠️ Points de Vigilance & Manquants

### Persistance des données (Priorité Haute)
*   **Le bug de l'étape 2 :** L'appel `POST /applications` initial ne supporte pas les champs `profession` et `address`. Si ces champs sont obligatoires, le backend renvoie une erreur 400 à l'étape suivante.
*   **Solution identifiée :** Chaîner un `PATCH /guardians` immédiatement après le `POST` initial à la fin de l'étape 1.

### Alignement des Contrats de Réinscription
*   **Public (`SoftEnrollment`) :** L'appel `reEnroll` nécessite l'ajout explicite du `tenantId`.
*   **Admin (`ReEnrollment`) :** Le composant nécessite une synchronisation de typage avec le template pour la recherche d'élèves.

### Expérience Utilisateur
*   **Gestion des Dates (409 Conflict) :** Améliorer l'interception des erreurs de calendrier scolaire pour afficher un message clair au parent si la fenêtre d'inscription est fermée.

---

## 3. 🗺️ Prochaines Étapes Préconisées

1.  **Chantier A :** Correction chirurgicale du `PublicFormStepperComponent` pour la persistance `profession/address`.
2.  **Chantier B :** Mise à jour du composant de réinscription administrative (Admin) avec recherche réelle d'élèves.
3.  **Chantier C :** Dashboard Admissions (Statistiques, Graphiques de conversion, Répartition par niveau).

---
*Document de suivi technique - Équipe Frontend Feewi*
