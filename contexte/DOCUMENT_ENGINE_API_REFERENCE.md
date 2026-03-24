# Référence API : Document Engine (Stockage & Binaires)

Ce guide détaille comment uploader et visualiser des fichiers (Photos, PDFs) dans Feewi.

---

## 1. Workflow d'Upload (Le Triple-Check)

Pour des raisons de performance et de sécurité, l'upload ne passe pas par le serveur Java. Il se fait en direct vers le stockage (MinIO/S3).

### Étape 1 : Demander un Ticket d'Upload
Le frontend demande au Document Engine une URL temporaire autorisant l'écriture.

*   **URL** : `POST /documents/api/v1/documents/upload-ticket`
*   **Header** : `X-Tenant-Id: <ID_ECOLE>`
*   **Payload** :
    ```json
    {
      "fileName": "extrait_naissance.pdf",
      "contentType": "application/pdf",
      "serviceOrigin": "enrollment"
    }
    ```
*   **Réponse** :
    ```json
    {
      "fileId": "uuid-du-fichier",
      "uploadUrl": "http://minio-url/bucket/path?signature..."
    }
    ```

### Étape 2 : Envoyer le fichier (Direct Upload)
Le frontend envoie le binaire directement à l'URL reçue.

*   **Méthode HTTP** : **`PUT`** (Impératif)
*   **URL** : Utiliser l'objet `uploadUrl` reçu à l'étape 1.
*   **Body** : Le fichier binaire pur (`File` ou `Blob`).
*   **Auth** : **Aucune** (Ne pas envoyer de Bearer Token vers cette URL).
*   **Header** : `Content-Type: <doit être identique à celui de l'étape 1>`

### Étape 3 : Lier le fichier au métier (Enrollment)
Une fois l'upload réussi (Status 200), le frontend informe le service métier que le document est prêt.

*   **URL** : `POST /enrollment/api/v1/public/applications/{appId}/documents/{docCode}`
*   **Payload** : `"uuid-du-fichier"` (L'ID reçu à l'étape 1).

---

## 2. Workflow de Visualisation

Les fichiers sont privés. Pour les afficher, il faut demander une URL de consultation temporaire.

### Étape 1 : Obtenir l'URL de Vue
*   **URL** : `GET /documents/api/v1/documents/{fileId}/view`
*   **Réponse** : Une String contenant l'URL pré-signée de lecture (valide 15-30 minutes).

### Étape 2 : Affichage
Il suffit d'injecter cette URL dans un `src` (img) ou de l'ouvrir dans un nouvel onglet :
```typescript
window.open(viewUrl, '_blank');
```

---

## 3. Guide d'implémentation Angular (Exemple)

```typescript
// 1. Demander le ticket
const ticket = await this.http.post<UploadTicketResponse>('/documents/api/v1/documents/upload-ticket', {
  fileName: file.name,
  contentType: file.type,
  serviceOrigin: 'enrollment'
}).toPromise();

// 2. Upload direct vers S3 (MinIO)
// Note: Utiliser un client HTTP SANS intercepteur JWT pour cette requête
await this.httpClientWithoutAuth.put(ticket.uploadUrl, file, {
  headers: { 'Content-Type': file.type }
}).toPromise();

// 3. Liaison avec le dossier d'admission
await this.http.post(`/enrollment/api/v1/public/applications/${id}/documents/EXT`, JSON.stringify(ticket.fileId)).toPromise();
```

---

## 4. Codes Documents Standards (`docCode`)
*   `EXT` : Extrait de naissance.
*   `BUL` : Bulletin de notes.
*   `PHOTO` : Photo d'identité.
*   `CNI` : Carte d'identité du tuteur.

---
*Document Engine Team - Mars 2026*
