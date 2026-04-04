# Référence API : Enrollment Service (Admissions)

Ce document est le contrat d'interface technique exhaustif entre le Backend et les Frontends.

---

## 1. Principes d'Authentification & Headers

| Espace | Authentification | Headers Requis |
| :--- | :--- | :--- |
| **Portail Parent** | Publique (Anonyme) | `X-Tenant-Id: <ID_ECOLE>` |
| **Portail Admin** | Bearer Token (JWT) | `Authorization: Bearer <TOKEN>` |
| **Général** | Multi-tenancy | Extrait automatiquement du Token (Admin) ou via Header (Public) |

---

## 2. API Publique (Portail Parent)
Base URL : `/enrollment/api/v1/public`

### 2.1 Résumé du portail (Landing Page)
*   **URL** : `GET /config/summary`
*   **Description** : Infos globales pour l'accueil (État, dates admission, message de bienvenue).

### 2.2 Configuration Effective
*   **URL** : `GET /config/{levelId}`
*   **Description** : Fusion Default + Overrides pour le formulaire dynamique.

### 2.3 Actions Dossier
*   **Créer** : `POST /applications`
*   **Mettre à jour Candidat** : `PATCH /applications/{id}/candidate`
*   **Mettre à jour Responsable** : `PATCH /applications/{id}/guardians`
*   **Champs Personnalisés** : `PATCH /applications/{id}/custom-fields`
*   **Services (Cantine...)** : `PATCH /applications/{id}/subscriptions`
*   **Upload Document** : `POST /applications/{id}/documents/{docCode}` (Body: UUID du fichier)
*   **Soumission** : `POST /applications/{id}/submit`

---

## 3. API Administration (Dashboard & Secrétariat)
Base URL : `/enrollment/api/v1/admin/applications`

### 3.1 Liste & Recherche Avancée (Paginée)
Endpoint unique pour le pilotage des dossiers. Supporte la pagination native Spring Data.

*   **URL** : `GET /`
*   **Paramètres (Query)** :
    *   `q` : Recherche textuelle (Nom, Prénom, Référence).
    *   `status` : Filtrage par état (`SUBMITTED`, `VERIFIED`, etc.).
    *   `levelId` : Filtrage par niveau scolaire.
    *   `academicYearId` : Filtrage par année.
    *   `channel` : `DIGITAL` ou `DIRECT`.
    *   `page` / `size` : Pagination (ex: `page=0&size=20`).
*   **Réponse** : `Page<AdminApplicationResponse>` (Structure standard Spring Page).

### 3.2 Saisie Directe (Guichet)
*   **URL** : `POST /direct`
*   **Payload (`FastEntryRequest`)** : Crée un dossier directement en statut `SUBMITTED`.

### 3.3 Traitement Opérationnel
*   **Détails** : `GET /{id}/details` (Dossier complet à 360°).
*   **Réception Papier** : `PATCH /{id}/documents/{docCode}/receive`
*   **Vérification Admin** : `PATCH /{id}/verify` (Passe à `VERIFIED`).
*   **Évaluation** : `PATCH /{id}/assessment` (Saisie des notes de test).

---

## 4. API Direction (Décisions Stratégiques)
Base URL : `/enrollment/api/v1/admin/direction/applications`

| Méthode | Endpoint | Description |
| :--- | :--- | :--- |
| `PATCH` | `/{id}/validate` | Validation standard (Vérifie le verrou numérique). |
| `PATCH` | `/{id}/overrule` | **Validation avec dérogation** (Passe outre le verrou). |
| `PATCH` | `/{id}/reject` | Refus définitif. |
| `POST` | `/bulk-validate` | **Validation groupée** (Body: `List<UUID>`). |

---

## 5. Configuration du Service (`/api/v1/admin/config`)
*   `GET /` : Récupérer toute la config.
*   `PUT /` : Mise à jour globale.
*   `PATCH /portal-status` : Master Switch (On/Off).
*   `PATCH /level-overrides/{levelId}` : Exceptions par niveau.

---

## 6. Modèles de Données (Extraits Pageable)

```json
{
  "content": [ { "id": "...", "reference": "...", "status": "..." } ],
  "totalPages": 5,
  "totalElements": 100,
  "size": 20,
  "number": 0
}
```

---
*Documentation Technique - Mise à jour Avril 2026 (Refactor Pagination)*
