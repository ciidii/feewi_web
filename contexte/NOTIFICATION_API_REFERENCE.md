# Référence API : Notification Service (v1)

Ce document détaille les points d'accès (Endpoints REST) exposés par le service de notifications. Il est destiné à l'équipe Frontend pour l'intégration du "Centre de notifications" dans les portails utilisateurs (Parent, Secrétariat, etc.).

## 1. Informations Générales
*   **Base URL (via Gateway) :** `http://localhost:8080/api/v1/notifications`
*   **Authentification :** JWT Bearer requis.
    *   Le `tenantId` (Établissement) est extrait du jeton.
    *   L'identifiant du destinataire (souvent l'email ou le `sub` du JWT) est extrait automatiquement pour sécuriser l'accès aux notifications personnelles.
*   **Format :** JSON / UTF-8.

---

## 2. Modèle de Données (`NotificationResponse`)

Lorsqu'une notification est renvoyée par l'API, elle respecte la structure suivante :

```json
{
  "id": "uuid",
  "channel": "IN_APP", // EMAIL, SMS, IN_APP
  "type": "ADMISSION_VALIDATED", // Type métier (ex: PAYMENT_REQUESTED, GENERAL_INFO)
  "subject": "[Feewi] Félicitations ! Votre enfant est admis",
  "content": "<p>Contenu HTML ou texte de la notification...</p>",
  "status": "SENT", // PENDING, SENT, FAILED, READ
  "createdAt": "2026-05-13T10:00:00Z",
  "sentAt": "2026-05-13T10:00:02Z",
  "readAt": null // Sera renseigné une fois marquée comme lue
}
```

---

## 3. Endpoints REST (Frontend Integration)

### 3.1. Récupérer l'historique de mes notifications
*   **URL :** `GET /mine`
*   **Paramètres :** Pagination (`page`, `size`).
*   **Réponse :** `Page<NotificationResponse>`.

### 3.2. Compter les notifications non lues (Badge)
*   **URL :** `GET /unread/count`
*   **Réponse :** Un entier (ex: `3`).

### 3.3. Marquer une notification comme lue
*   **URL :** `PATCH /{id}/read`
*   **Réponse :** `204 No Content`.

### 3.4. Flux temps réel (SSE)
*   **URL :** `GET /stream`
*   **Réponse :** Flux `text/event-stream`.

---

## 4. Notifications en Temps Réel (Server-Sent Events)

Le service utilise les **SSE (Server-Sent Events)** pour pousser les notifications `IN_APP` instantanément au navigateur sans que le frontend n'ait besoin de rafraîchir la page (polling).

### 4.1. S'abonner au flux
Le frontend doit ouvrir une connexion persistante vers cet endpoint dès que l'utilisateur est connecté.

*   **URL :** `/api/v1/notifications/stream` (via Gateway)
*   **Protocole :** HTTP `text/event-stream`
*   **Authentification :** JWT requis (passé via les cookies ou un paramètre si EventSource natif, ou via un header avec une lib comme `microsoft-fetch-event-source`).

### 4.2. Événements reçus
Une fois connecté, le frontend peut recevoir les événements suivants :

1.  **`INIT`** : Reçu immédiatement après la connexion réussie.
    *   `data`: "Connexion établie"
2.  **`NOTIFICATION`** : Reçu à chaque fois qu'une nouvelle notification `IN_APP` est générée pour l'utilisateur.
    *   `data`: Objet `Notification` complet.

### 4.3. Exemple d'implémentation (JavaScript/Angular)
```javascript
const eventSource = new EventSource('http://localhost:8080/api/v1/notifications/stream', {
  withCredentials: true
});

eventSource.addEventListener('NOTIFICATION', (event) => {
  const notification = JSON.parse(event.data);
  console.log('Nouvelle notification reçue !', notification.subject);
  // Mettre à jour le badge et la liste UI ici
});
```

---

## 5. Endpoints Internes / Test

### 5.1. Simuler l'envoi d'une notification
*   **URL :** `POST /test-send`
*   **Corps :** `NotificationRequestedEvent`.

---

## 6. Intégration Recommandée (Frontend Angular)

1.  **Au chargement :** Appeler `GET /unread/count` et ouvrir la connexion `GET /stream`.
2.  **Sur événement `NOTIFICATION` :** Incrémenter le badge et ajouter l'item en haut de la liste.
3.  **Au clic :** Appeler `PATCH /{id}/read`.