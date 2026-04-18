# Récapitulatif des Endpoints - Enrollment Service

Ce document liste l'ensemble des points d'entrée (endpoints) exposés par le module `enrollment-service`, classés par contrôleur.

## 1. Administration : Configuration (`/api/v1/admin/config`)
Gère la configuration globale des inscriptions pour un établissement (tenant).

| Méthode | Chemin | Description |
| :--- | :--- | :--- |
| **GET** | `/` | Récupère la configuration actuelle. |
| **PUT** | `/` | Met à jour la configuration (mode, schéma, instructions, textes légaux). |
| **PATCH** | `/portal-status` | Active ou désactive le portail public (`active` en paramètre). |
| **PUT** | `/year-overrides/{yearId}` | Définit des surcharges pour une année académique spécifique. |
| **DELETE** | `/year-overrides/{yearId}` | Supprime les surcharges d'une année académique. |
| **PUT** | `/cycle-overrides/{cycleType}` | Définit des surcharges pour un type de cycle (ex: PRIMAIRE). |
| **DELETE** | `/cycle-overrides/{cycleType}` | Supprime les surcharges d'un type de cycle. |
| **PATCH** | `/level-overrides/{levelId}` | Met à jour l'état d'un niveau (actif, complet). |
| **POST** | `/reset` | Réinitialise la configuration aux valeurs par défaut. |

---

## 2. Administration : Gestion des Admissions (`/api/v1/admin/admissions`)
Outils pour le secrétariat et la saisie directe.

| Méthode | Chemin | Description |
| :--- | :--- | :--- |
| **GET** | `/` | Recherche paginée avec filtres (statut, niveau, année, canal, texte). |
| **GET** | `/{id}/details` | Récupère les détails complets d'une admission. |
| **POST** | `/direct` | **Saisie au guichet** : Crée un bundle et une admission en une seule étape. |
| **PATCH** | `/{id}/assessment` | Enregistre l'évaluation (notes, décision, niveau recommandé). |
| **PATCH** | `/{id}/documents/{docName}/receive` | Marque un document physique comme reçu. |
| **PATCH** | `/{id}/verify` | Vérifie la conformité du dossier (passage au statut VERIFIED). |
| **POST** | `/{id}/cancel` | Annule une admission. |

---

## 3. Direction : Validation et Décisions (`/api/v1/admin/direction/admissions`)
Actions réservées à la direction pour la validation finale.

| Méthode | Chemin | Description |
| :--- | :--- | :--- |
| **PATCH** | `/{id}/validate` | Valide définitivement une admission. |
| **PATCH** | `/{id}/overrule` | Force la validation d'une admission (passe outre certaines règles). |
| **PATCH** | `/{id}/reject` | Rejette une admission avec un motif. |
| **PATCH** | `/{id}/waitlist` | Place l'admission en liste d'attente. |
| **POST** | `/bulk-validate` | Valide une liste d'admissions en masse. |

---

## 4. Portail Public / Parents (`/api/v1/public/admissions`)
Processus d'inscription en libre-service pour les parents.

| Méthode | Chemin | Description |
| :--- | :--- | :--- |
| **POST** | `/bundles` | **Étape 1** : Initialise le dossier familial (Tronc). |
| **GET** | `/bundles/{bundleId}` | Récupère un bundle sécurisé (nécessite `accessCode`). |
| **POST** | `/bundles/{bundleId}/children` | **Étape 2** : Ajoute un enfant (admission) au dossier familial. |
| **PATCH** | `/{id}/pillars/{pillarKey}` | Met à jour un pilier spécifique d'une admission (ex: identity, medical). |
| **PATCH** | `/bundles/{bundleId}/pillars/{pillarKey}` | Met à jour un pilier du bundle (ex: family). |
| **POST** | `/re-enroll` | Initie une réinscription pour un élève existant. |
| **PATCH** | `/{id}/subscriptions` | Met à jour les abonnements aux services (cantine, transport). |
| **POST** | `/{id}/documents/{docCode}` | Upload un document pour une admission. |
| **GET** | `/mine` | Liste les admissions liées à un email parent. |
| **GET** | `/{reference}/track` | Suivi du statut d'une admission via sa référence et code d'accès. |
| **POST** | `/{id}/submit` | Soumet une admission individuelle. |
| **POST** | `/bundles/{bundleId}/submit` | Soumet l'intégralité du bundle familial. |
| **POST** | `/{id}/cancel` | Annule une admission. |

---

## 5. Configuration Publique (`/api/v1/public/config`)
Informations nécessaires au rendu du formulaire d'inscription.

| Méthode | Chemin | Description |
| :--- | :--- | :--- |
| **GET** | `/summary` | Résumé des années et niveaux disponibles pour le portail public. |
| **GET** | `/{levelId}` | Récupère la configuration effective (champs, documents) pour un niveau. |
| **GET** | `/default` | Récupère la configuration effective par défaut (sans niveau spécifique). |
