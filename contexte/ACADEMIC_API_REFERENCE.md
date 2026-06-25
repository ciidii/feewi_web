# Référence API : Academic Structure Service (v1)

Ce document détaille les points d'accès pour la gestion du calendrier scolaire et de la structure pédagogique.

## 1. Informations Générales
*   **Base URL (via Gateway) :** `http://localhost:8080/api/v1/academic`
*   **Authentification :** JWT Bearer requis (Le `tenantId` est extrait du jeton).
*   **Format :** JSON / UTF-8.

---

## 2. Gestion de la Temporalité (`/years`)

### 2.1 Créer une année scolaire
*   **URL :** `POST /years`
*   **Contraintes :**
    *   Le label doit être unique par école.
    *   Les dates ne doivent pas chevaucher une année existante.
    *   Durée : 6 à 12 mois.
*   **Requête :**
    ```json
    {
      "label": "2025-2026",
      "systemType": "TRIMESTER", // TRIMESTER, SEMESTER, ANNUAL
      "adminStartDate": "2025-09-01",
      "adminEndDate": "2026-08-31",
      "lessonsStartDate": "2025-10-06",
      "lessonsEndDate": "2026-06-30"
    }
    ```

### 2.2 Workflow du Cycle de Vie
| Méthode | Path | État source | Effet |
| :--- | :--- | :--- | :--- |
| `PATCH` | `/years/{id}/activate` | `PLANNING` | Devient l'année par défaut. Archive l'ancienne. |
| `PATCH` | `/years/{id}/close` | `ACTIVE` | Prépare la fin d'année. Verrouille le calendrier. |
| `PATCH` | `/years/{id}/reopen` | `CLOSING` | Repasse en actif (si erreur). |
| `PATCH` | `/years/{id}/archive` | `CLOSING` | Passage définitif en lecture seule. |

---

## 3. Découpage Pédagogique (`/years/{yearId}/periods`)

### 3.1 Créer une période (Trimestre/Semestre)
*   **URL :** `POST /years/{yearId}/periods`
*   **Contraintes :**
    *   Doit être incluse dans les dates de cours de l'année.
    *   Nombre max de périodes limité par le `systemType` de l'année (ex: 3 pour TRIMESTER).
*   **Requête :**
    ```json
    {
      "label": "1er Trimestre",
      "startDate": "2025-10-06",
      "endDate": "2025-12-20",
      "examStartDate": "2025-12-15",
      "examEndDate": "2025-12-20",
      "gradingDeadline": "2025-12-24"
    }
    ```

---

## 4. Vacances & Fêtes (`/years/{yearId}/holidays`)

### 4.1 Ajouter un congé
*   **URL :** `POST /years/{yearId}/holidays`
*   **Requête :**
    ```json
    {
      "label": "Vacances de Noël",
      "startDate": "2025-12-20",
      "endDate": "2026-01-04",
      "schoolClosed": true
    }
    ```

---

## 5. Référentiel de Structure (`/cycles`, `/levels`)

### 5.1 Cycles Éducatifs
*   **URL :** `GET /cycles` | `POST /cycles`
*   **Donnée :** `{ "name": "Primaire", "rank": 2 }`
*   **Usage :** Grands blocs d'organisation (Maternelle, Primaire, Moyen, Lycée).

### 5.2 Niveaux Éducatifs (Educational Levels)
*   **URL :** `GET /levels` | `POST /levels`
*   **Requête :**
    ```json
    {
      "name": "CM2",
      "cycleId": "uuid-du-cycle-primaire",
      "rank": 6 // Définit l'ordre pour le roll-over
    }
    ```
*   **Réponse :**
    ```json
    {
      "id": "uuid",
      "name": "CM2",
      "rank": 6,
      "cycle": { "id": "...", "name": "Primaire", "rank": 2 }
    }
    ```

---

## 6. Codes d'Erreurs Spécifiques (Angular Integration)

| Code | Message Type | Cause probable |
| :--- | :--- | :--- |
| `400` | "Bad Request" | Date de début > date de fin, ou champ obligatoire manquant. |
| `403` | "Forbidden" | Tentative de modifier une année ARCHIVED ou accès IDOR. |
| `409` | "Conflict" | Chevauchement de dates ou label déjà existant. |

---
*Référence API validée par l'Architecte - Mars 2026*
