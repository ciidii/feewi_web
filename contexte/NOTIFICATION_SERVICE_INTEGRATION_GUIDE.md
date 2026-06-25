# Guide d'Intégration : Service de Notification (Notification Service)

Ce document détaille l'intégration du `notification-service` pour la gestion des messages temps réel, de l'historique des notifications et des préférences utilisateur au sein de l'écosystème Feewi.

---

## 1. Vision et Architecture
Le `notification-service` est un service centralisé qui reçoit des événements des autres microservices (via RabbitMQ) et les distribue aux utilisateurs finaux via plusieurs canaux :
1.  **In-App (WebSocket)** : Pour les alertes instantanées dans le navigateur.
2.  **Notification Center** : Pour l'historique persistant (icône cloche).
3.  **Email/SMS** : Pour les notifications hors plateforme (géré en arrière-plan).

---

## 2. Intégration Temps Réel (WebSockets)
Le frontend se connecte via le protocole STOMP sur SockJS pour recevoir les notifications "live".

*   **Endpoint de connexion :** `/ws-notifications`
*   **Topic à écouter (Personnel) :** `/user/queue/notifications`
*   **Topic à écouter (Tenant/Établissement) :** `/topic/tenant/{tenantId}`

---

## 3. Référence API (`/api/v1/notifications`)

### 3.1 Lister les notifications (Centre de Notifications)
Récupère les 30 derniers événements pour alimenter le volet latéral ou le menu cloche.
*   **URL :** `GET /`
*   **Query Params :** `page=0`, `size=30`, `unreadOnly=false`
*   **Usage :** Affichage de l'historique.

### 3.2 Marquer comme lu
*   **URL :** `PATCH /{id}/read`
*   **URL (Massive) :** `PATCH /read-all`

### 3.3 Supprimer une notification
*   **URL :** `DELETE /{id}`

### 3.4 Préférences de notification
Gérer les canaux préférés pour chaque type d'événement.
*   **URL :** `GET /preferences` | `PUT /preferences`

---

## 4. Modèle de Données (`Notification`)

| Champ | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Identifiant unique. |
| `type` | Enum | `INFO`, `WARNING`, `SUCCESS`, `URGENT`, `ANNOUNCEMENT`. |
| `title` | String | Titre court du message. |
| `content` | String | Corps du message (Supporte le Markdown léger). |
| `link` | String | URL relative pour l'action (ex: `/admin/admissions/123`). |
| `read` | Boolean | État de lecture. |
| `createdAt` | ISO-8601 | Date de réception. |
| `sourceService`| String | Service émetteur (ex: `enrollment-service`). |

---

## 5. Guide UX (Integration Angular)

### 5.1 La Cloche (Header)
*   **Repos** : Icône `Bell` standard (Lucide).
*   **Actif** : Afficher un badge rouge (`notification-pulse`) avec le compteur des non-lus.
*   **Interaction** : Le clic ouvre un `Popover` ou un `Drawer` latéral contenant la liste.

### 5.2 Les Types d'Alertes
Selon la matrice de notification Feewi :
*   **SUCCESS/INFO** : Peuvent générer un **Toast** éphémère + une entrée dans l'historique.
*   **WARNING** : Génère une entrée dans l'historique, pas forcément de toast si l'utilisateur est actif.
*   **URGENT** : Peut déclencher une **Bannière** persistante en haut de l'écran tant que l'action n'est pas traitée.

### 5.3 Actions Contextuelles
Si le champ `link` est présent, la notification doit être cliquable pour rediriger l'utilisateur vers l'objet concerné (ex: une nouvelle demande d'admission).

---
*Validé par l'Architecture Feewi - Mai 2026*
