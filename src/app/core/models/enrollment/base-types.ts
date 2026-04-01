/** États du workflow d'un dossier d'admission */
export type AdmissionStatus = 
  | 'DRAFT'      // Brouillon (Parent)
  | 'SUBMITTED'  // Envoyé (Parent -> Admin)
  | 'VERIFIED'   // Conforme (Secrétariat)
  | 'TESTING'    // Évaluation en cours (Pédagogique)
  | 'WAITLIST'   // Liste d'attente
  | 'VALIDATED'  // Admis définitivement
  | 'REJECTED'   // Refusé
  | 'CANCELLED'; // Annulé par le parent

/** Type de procédure d'admission */
export type AdmissionType = 'NEW' | 'RE_ENROLL';

/** Lien de parenté du responsable */
export type GuardianRelation = 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'OTHER';

/** État de traitement d'une pièce justificative */
export type DocumentStatus = 'MISSING' | 'PHYSICAL_RECEIVED' | 'UPLOADED';

/** Type d'évaluation pour la sélection */
export type AssessmentType = 'EXAM' | 'DOSSIER' | 'INTERVIEW' | null;
