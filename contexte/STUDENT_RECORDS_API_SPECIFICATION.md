# Spécification API : Student Records (Dossiers Scolaires & Compliance)

Ce document définit l'endpoint dédié à la gestion de la conformité administrative et à la consultation des archives académiques des élèves.

---

## 1. Vision Métier
Contrairement à la "Liste des élèves" qui est opérationnelle (Qui est là ?), le "Dossier Scolaire" est un outil de **pilotage de la qualité des données**. Il permet au secrétariat de :
- Identifier les dossiers incomplets (pièces manquantes).
- Accéder aux archives des années passées (bulletins, certificats).
- Générer des rapports de conformité par classe.

---

## 2. Endpoint : Liste de Compliance
Retourne une vue synthétique de l'état documentaire des élèves.

*   **URL** : `GET /student/api/v1/records`
*   **Query Parameters** :
    *   `levelId` (optionnel) : Filtrer par niveau (ex: tous les CM2).
    *   `academicYearId` (optionnel) : Filtrer par année.
    *   `complianceStatus` (optionnel) : `COMPLETE` | `INCOMPLETE`.
    *   `missingDocCode` (optionnel) : Filtrer les élèves à qui il manque un document spécifique (ex: `PHOTO`, `EXT`).
*   **Réponse (`StudentRecordSummary`)** :
```json
{
  "content": [
    {
      "studentId": "uuid",
      "registrationNumber": "FE-2026-A1EA",
      "fullName": "Adama DIALLO",
      "currentLevel": "CM2",
      "compliance": {
        "isComplete": false,
        "ratio": "3/4",
        "missingDocuments": [
          { "code": "PHOTO", "name": "Photo d'identité" }
        ],
        "status": "PENDING_VERIFICATION"
      },
      "lastAcademicResult": "PROMOTED",
      "hasArchives": true
    }
  ],
  "totalElements": 150,
  "totalPages": 8
}
```

---

## 3. Endpoint : Archives Académiques
Permet de récupérer l'historique des documents officiels générés pour l'élève.

*   **URL** : `GET /student/api/v1/records/{studentId}/archives`
*   **Réponse (`List<StudentArchive>`)** :
```json
[
  {
    "academicYear": "2024-2025",
    "level": "CM1",
    "documentType": "REPORT_CARD_FINAL",
    "documentName": "Bulletin Annuel 2024-2025",
    "fileId": "uuid-doc-engine",
    "generatedAt": "2025-06-30T10:00:00Z"
  },
  {
    "academicYear": "2024-2025",
    "level": "CM1",
    "documentType": "CERTIFICATE",
    "documentName": "Certificat de Scolarité",
    "fileId": "uuid-doc-engine",
    "generatedAt": "2024-10-15T09:00:00Z"
  }
]
```

---

## 4. Modèles de Données Frontend (Typescript)

```typescript
export interface ComplianceInfo {
  isComplete: boolean;
  ratio: string; // ex: "3/4"
  missingDocuments: Array<{ code: string, name: string }>;
  status: 'COMPLETE' | 'INCOMPLETE' | 'PENDING_VERIFICATION';
}

export interface StudentRecordSummary {
  studentId: string;
  registrationNumber: string;
  fullName: string;
  currentLevel: string;
  compliance: ComplianceInfo;
  lastAcademicResult: string;
  hasArchives: boolean;
}

export interface StudentArchive {
  academicYear: string;
  level: string;
  documentType: string;
  documentName: string;
  fileId: string;
  generatedAt: string;
}
```

---

## 5. Actions Requises (Frontend)
- **Vue Liste** : Utiliser `Data-List` avec des badges de couleur pour le `ratio` de compliance (Rouge si < 100%, Vert si complet).
- **Filtres** : Ajouter un sélecteur "Document manquant" pour permettre au secrétaire de faire des relances ciblées.
- **Vue Détail** : Ajouter un onglet "Archives" dans la fiche 360° pour lister les documents PDF historiques.

---
*Spécification rédigée par Gemini CLI - Avril 2026*
