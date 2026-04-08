# Référence API : Enrollment Service (Architecture Piliers & CMS)

Ce document est le contrat d'interface officiel pour le passage à l'architecture SaaS par Piliers. Il définit comment le Frontend doit générer dynamiquement le formulaire d'admission.

---

## 1. La Vision : "Formulaire Piloté par les Piliers"
Pour concilier la stabilité de la plateforme Feewi et la liberté des écoles, le formulaire est découpé en **Piliers thématiques**. Chaque pilier contient deux zones distinctes :

1.  **Zone Système (🔒 System Fields)** : Champs indispensables au moteur Feewi (Nom, Email, etc.).
    *   *Règle* : L'école peut modifier le libellé (`label`) mais pas supprimer le champ.
2.  **Zone Libre (➕ Custom Fields)** : Champs créés à 100% par l'établissement.
    *   *Règle* : Liberté totale d'ajout, de suppression et de typage.

---

## 2. API Administration (Gestion du Formulaire)
Base URL : `/enrollment/api/v1/admin/config`

### 2.1 Récupérer la structure du CMS
*   **URL** : `GET /`
*   **Réponse (`EnrollmentConfig`)** :
```json
{
  "pillars": {
    "pillar_identity": {
      "label": "Identité",
      "systemFields": [
        { "name": "firstName", "label": "Prénom de l'élève", "type": "TEXT" }
      ],
      "customFields": [
        { "name": "religion", "label": "Confession religieuse", "type": "TEXT" }
      ]
    }
  }
}
```

### 2.2 Réinitialiser le formulaire
*   **URL** : `POST /reset`
*   **Action** : Restaure les 4 piliers système par défaut de Feewi et supprime tous les champs personnalisés. Utile en cas d'erreur de configuration massive de l'école.

---

## 3. API Publique (Générateur de Formulaire)
Base URL : `/enrollment/api/v1/public/admissions`

### 3.1 Résumé & Gouvernance
*   **URL** : `GET /config/summary`
*   **Champ `registrationMode`** : Indique si le portail affiche "Inscrire mon enfant" (`PARENT_ONLY`) ou "M'inscrire" (`SELF_ONLY`).

### 3.2 Configuration par Niveau
*   **URL** : `GET /config/{levelId}`
*   **Usage Frontend** : Cet objet doit être utilisé pour générer les formulaires.
    1.  Boucler sur les clés de `pillars`.
    2.  Pour chaque pilier, afficher le `label`.
    3.  Afficher d'abord les `systemFields`, puis les `customFields`.

---

## 4. Guide d'implémentation Angular

### Rendu Dynamique des Champs
Pour chaque champ (qu'il soit système ou personnalisé), le Frontend doit utiliser les propriétés suivantes :
- `type == 'TEXT'` -> `<input type="text">`
- `type == 'DATE'` -> `<input type="date">`
- `type == 'BOOLEAN'` -> `<input type="checkbox">`
- `mandatory == true` -> Ajouter le validateur `Validators.required`.

### Identifiants de données (Mapping)
Lors de la soumission (`POST /admissions`), les données doivent être rangées dans les objets correspondants :
- Les `systemFields` du pilier Identité vont dans l'objet `identity` de la requête.
- Les `customFields` du pilier Identité vont dans `identity.customFields`.

---
*Documentation Technique - Architecture CMS Piliers - Avril 2026*
