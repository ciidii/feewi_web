# Spécification API : Dashboard Admissions Agrégé

**Date :** 27 Mai 2026
**Domaine :** Enrollment (Inscriptions)
**Priorité :** Haute (Optimisation Sécurité, Performance et Cohérence Métier)

## 1. Contexte & Problématique

Actuellement, le frontend (Composant `AdmissionDashboardComponent`) doit effectuer plusieurs requêtes asynchrones parallèles (`/admissions`, `/levels`, `/classes`, `/years`) et rapatrier potentiellement des centaines de dossiers pour calculer localement les statistiques du tableau de bord (taux de conversion, files d'attente, taux d'occupation des niveaux).

Cette approche pose trois problèmes majeurs :
1. **Sécurité (PBAC)** : Il est difficile d'appliquer la permission `enrollment:admission:view` de manière ciblée sur l'agrégation.
2. **Performance** : Le frontend charge trop de données brutes, ce qui ralentit le rendu et consomme de la bande passante inutilement.
3. **Cohérence Métier** : Les règles de calcul (ex: "qu'est-ce qu'un niveau saturé ?", "comment calculer le taux de conversion ?") sont codées en TypeScript dans le frontend au lieu d'être centralisées sur le backend.

## 2. Objectif

Créer **un point de terminaison (endpoint) unique** sur le backend dédié à la fourniture des données pré-calculées pour le tableau de bord des admissions. Le backend se chargera de l'agrégation de la base de données.

## 3. Spécifications de l'Endpoint

*   **Méthode :** `GET`
*   **URL :** `/api/v1/enrollment/admin/stats/dashboard`
*   **Sécurité (PBAC) requise :** `enrollment:admission:view`
*   **Paramètres de requête (Query Params) :**
    *   `academicYearId` (Optionnel) : L'ID de l'année scolaire. Si omis, le backend doit utiliser l'année académique active par défaut.

## 4. Structure de la Réponse (Payload JSON)

L'API doit retourner une structure `200 OK` avec un objet consolidé contenant toutes les métriques nécessaires à l'UI.

```json
{
  "metrics": {
    "totalApplications": 124,         // Total des dossiers sur la campagne
    "newApplications": 85,            // Type = NEW_ENROLLMENT
    "reEnrollments": 39,              // Type = RE_ENROLLMENT
    "conversionRate": 48.5,           // (validés / total) * 100
    "growthTrend": 12                 // (Optionnel) % d'évolution vs année N-1 à la même date
  },
  "operational": {
    "pendingVerification": 15,        // Dossiers au statut 'SUBMITTED'
    "pendingEvaluation": 8,           // Dossiers au statut 'VERIFIED'
    "pendingDecision": 5,             // Dossiers prêts pour la décision finale
    "incompleteDossiers": 4           // Dossiers avec des pièces requises 'MISSING' ou 'REJECTED'
  },
  "pipeline": {
    "submitted": 45,                  // Entrée du tunnel
    "verified": 30,                   // Étape 2
    "testing": 25,                    // Étape 3 (inclut TESTING, WAITLIST)
    "validated": 20                   // Fin du tunnel
  },
  "capacity": {
    "saturatedLevelsCount": 2,        // Nombre de niveaux dont le taux d'occupation >= 90%
    "levels": [
      {
        "id": "uuid-level-1",
        "name": "6ème",
        "totalApplications": 45,      // Dossiers ciblés sur ce niveau
        "validated": 20,              // Dossiers validés pour ce niveau
        "totalCapacity": 120,         // Somme des capacités de toutes les classes associées à ce niveau
        "occupancyRate": 16.6,        // (validated / totalCapacity) * 100
        "isSaturated": false          // true si occupancyRate >= 90%
      }
      // ... classé par taux d'occupation décroissant
    ]
  },
  "upcomingMilestones": [
    // Réservé pour de futures intégrations (Agenda / Calendrier d'admission)
    { 
      "label": "Commission Pédagogique #4", 
      "date": "2026-04-24T14:00:00Z", 
      "location": "Salle A" 
    },
    { 
      "label": "Clôture Inscriptions Portail", 
      "date": "2026-04-30T23:59:59Z" 
    }
  ]
}
```

## 5. Règles de gestion (Business Rules) pour le Backend

1. **Calcul des Taux :** Arrondir les pourcentages à une décimale.
2. **Capacité Théorique :** Le calcul de `totalCapacity` d'un niveau est la somme des champs `capacity` des `Class` liées à ce `Level` pour l'année académique donnée.
3. **Dossiers Incomplets :** Un dossier est compté dans `incompleteDossiers` s'il n'est pas dans un statut terminal (`VALIDATED`, `REJECTED`, `CANCELLED`) ET qu'il possède au moins un document obligatoire dont le statut est `MISSING` ou `REJECTED`.
4. **Saturation :** Le seuil de saturation est fixé métier à `90%`.

## 6. Actions Frontend Post-Déploiement

Une fois cette API déployée par l'équipe Backend, l'équipe Frontend devra :
1. Mettre à jour `EnrollmentAdminService` pour consommer cet endpoint.
2. Nettoyer `AdmissionDashboardComponent` pour supprimer les appels multiples et la logique de calcul complexe.
3. Binder directement le résultat de l'API au template HTML.