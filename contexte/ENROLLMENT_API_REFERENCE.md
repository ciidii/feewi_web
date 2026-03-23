# Référence API : Enrollment Service (Admissions)

Ce document détaille les endpoints et le workflow nécessaires pour l'intégration du microservice **Enrollment**.

---

## 1. Principes d'Authentification & Multi-tenancy

Le service opère selon deux modes distincts :

### A. Mode Public (Portail Parent)
*   **Authentification** : Aucune (Anonyme).
*   **Header Obligatoire** : `X-Tenant-Id` (requis uniquement pour la création initiale du dossier).
*   **Tracking** : Sécurisé par le couple `Référence` + `AccessCode` (générés à la création).

### B. Mode Admin (Secrétariat / Direction)
*   **Authentification** : `Authorization: Bearer <JWT>`.
*   **Tenant Isolation** : Le `tenant_id` est extrait automatiquement du JWT par le backend. Le header `X-Tenant-Id` est ignoré en mode authentifié.

---

## 2. Workflow du Dossier (Statuts)

Le passage d'un état à l'autre est protégé par des règles métier strictes :

1.  **`DRAFT`** : Saisie en cours (modifiable).
2.  **`SUBMITTED`** : Soumis par le parent (verrouillé pour le parent).
3.  **`VERIFIED`** : Conformité administrative validée par le secrétariat.
4.  **`TESTING`** : Évaluation pédagogique en cours (notes saisies).
5.  **`VALIDATED`** : Admission définitive (**Verrou Numérique** : requiert 100% des pièces obligatoires numérisées).
6.  **`REJECTED`** : Dossier refusé.

---

## 3. Endpoints : Portail Parent (Public)

### Créer un nouveau dossier
`POST /enrollment/api/v1/public/applications`
*   **Headers** : `X-Tenant-Id: <ID_ECOLE>`
*   **Payload** :
    ```json
    {
      "type": "NEW",
      "academicYearId": "uuid",
      "levelId": "uuid",
      "filiereId": "uuid (optionnel)"
    }
    ```
*   **Réponse** : Retourne l'objet complet avec `reference` et `accessCode`. **Le frontend doit stocker ces deux valeurs pour permettre au parent de revenir sur son dossier.**

### Réinscription (Soft-Enrollment)
`POST /enrollment/api/v1/public/applications/re-enroll`
*   **Payload** : `{ "studentId": "uuid", "academicYearId": "uuid", "nextLevelId": "uuid" }`
*   **Action** : Crée un dossier pré-rempli avec les données existantes.

### Mettre à jour le Candidat / Tuteur
`PATCH /enrollment/api/v1/public/applications/{id}/candidate`
`PATCH /enrollment/api/v1/public/applications/{id}/guardians`
*   **Note** : Uniquement possible en état `DRAFT`.

### Uploader un document
`POST /enrollment/api/v1/public/applications/{id}/documents/{docCode}`
*   **Body** : URL du fichier (String brute ou JSON selon stockage).
*   **docCode** : `EXT`, `BUL`, `PHOTO`, etc.

### Suivre l'avancement (Tracker)
`GET /enrollment/api/v1/public/applications/{reference}/track?accessCode={code}`
*   **Réponse** : Contient le `status` et un `trackerMessage` localisé pour l'affichage (ex: "Dossier en cours de vérification...").

### Soumission finale
`POST /enrollment/api/v1/public/applications/{id}/submit`
*   **Action** : Passe le dossier de `DRAFT` à `SUBMITTED`.

---

## 4. Endpoints : Back-office (Admin)

### Lister les dossiers
`GET /enrollment/api/v1/admin/applications`
*   **Scope** : Retourne tous les dossiers du tenant actuel.

### Réception physique de documents
`PATCH /enrollment/api/v1/admin/applications/{id}/documents/{docCode}/receive`
*   **Action** : Marque une pièce comme reçue en main propre au guichet.

### Valider la conformité (Compliance)
`PATCH /enrollment/api/v1/admin/applications/{id}/verify`
*   **Action** : Passe à `VERIFIED`. Échoue si des pièces obligatoires manquent (physiquement ou numériquement).

### Saisir l'évaluation pédagogique
`PATCH /enrollment/api/v1/admin/applications/{id}/assessment`
*   **Payload** :
    ```json
    {
      "grades": { "Maths": 15, "Français": 12 },
      "comments": "Très bon niveau",
      "decision": "ADMITTED",
      "recommendedLevelId": "uuid"
    }
    ```

---

## 5. Endpoints : Direction (Décision)

### Validation Finale
`PATCH /enrollment/api/v1/admin/direction/applications/{id}/validate`
*   **Vérification** : Déclenche le **Verrou Numérique**. Si un document obligatoire n'est pas uploadé (même s'il est reçu physiquement), l'admission est bloquée.

---

## 6. Gestion de la Configuration

`GET /enrollment/api/v1/admin/config` : Récupère les réglages de l'école.
`PUT /enrollment/api/v1/admin/config` : Définit la checklist des documents et le schéma du formulaire.

---

## 7. Gestion des Erreurs (Format Standard)

Toutes les erreurs renvoient un objet JSON :
```json
{
  "message": "Libellé de l'erreur exploitable par le frontend",
  "status": 400,
  "timestamp": "2026-03-23T08:00:00Z",
  "path": "/api/v1/..."
}
```
*   **400 Bad Request** : Données invalides ou document inconnu.
*   **403 Forbidden** : Token invalide ou droits insuffisants.
*   **409 Conflict** : Tentative de modification d'un dossier verrouillé.
*   **404 Not Found** : Référence ou dossier introuvable.
