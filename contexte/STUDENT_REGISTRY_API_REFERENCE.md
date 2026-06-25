# Référence API : Student Registry Service (Référentiel Élèves)

Ce document détaille les interfaces de communication entre le service **Student Registry** et le Frontend Angular.

---

## 1. Principes de Base
- **Base URL** : `/student/api/v1/students`
- **Authentification** : Bearer JWT obligatoire.
- **Tenant ID** : Extrait automatiquement du Token (Isolation SaaS).

---

## 2. Endpoints du Référentiel

### 2.1 Lister et Rechercher (Paginé)
Retourne une liste d'élèves filtrable avec support de la pagination Spring Data.

*   **URL** : `GET /`
*   **Query Parameters** :
    *   `q` (optionnel) : Mot-clé de recherche (Nom, Prénom, Matricule).
    *   `status` (optionnel) : `ACTIVE`, `SUSPENDED`, `LEFT`, `ARCHIVED`.
    *   `page` (défaut: 0) : Numéro de la page.
    *   `size` (défaut: 20) : Taille de la page.
*   **Exemple de réponse (Pagination Spring)** :
```json
{
  "content": [
    {
      "id": "8dac21a7-15f9-4847-8cf8-c375fdcfb809",
      "registrationNumber": "FE-2026-A1EA",
      "firstName": "Adama",
      "lastName": "Diallo",
      "gender": "M",
      "birthDate": "2026-04-03",
      "status": "ACTIVE",
      "customFields": {
        "custom_religion": "Islam"
      }
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20
  },
  "totalPages": 1,
  "totalElements": 1,
  "last": true
}
```

### 2.2 Dossier Complet (360°)
Récupère l'intégralité des données d'un élève, y compris sa santé, ses parents et son historique.

*   **URL** : `GET /{id}`
*   **Réponse (`StudentResponse`)** :
```json
{
  "id": "8dac21a7-15f9-4847-8cf8-c375fdcfb809",
  "registrationNumber": "FE-2026-A1EA",
  "firstName": "Adama",
  "lastName": "Diallo",
  "gender": "M",
  "birthDate": "2026-04-03",
  "bloodGroup": "O+",
  "emergencyContact": {
    "name": "Moussa Diallo",
    "phone": "+221770000000",
    "relation": "ONCLE"
  },
  "guardians": [
    {
      "guardianEmail": "parent@email.com",
      "relation": "FATHER",
      "financialResponsible": true
    }
  ],
  "history": [
    {
      "academicYearId": "uuid-year",
      "levelId": "uuid-cm1",
      "result": "ADMITTED"
    }
  ]
}
```

### 2.3 Mise à jour du Profil
Permet de modifier les informations administratives ou médicales.

*   **URL** : `PATCH /{id}`
*   **Payload (`UpdateStudentRequest`)** :
```json
{
  "bloodGroup": "A+",
  "criticalAllergies": "Asthme",
  "status": "ACTIVE",
  "customFields": {
    "religion": "Islam"
  }
}
```

---

## 3. Modèles de Données (Typescript)

```typescript
export interface StudentSummary {
  id: string;
  registrationNumber: string;
  firstName: string;
  lastName: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'LEFT' | 'ARCHIVED';
}

export interface StudentResponse extends StudentSummary {
  gender: 'M' | 'F';
  birthDate: string;
  bloodGroup?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  guardians: GuardianLink[];
  history: SchoolingHistory[];
  customFields: Record<string, any>;
}
```

---
*Documentation Technique - Avril 2026*
