/**
 * États possibles d'un dossier d'admission
 */
export type AdmissionStatus = 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'TESTING' | 'WAITLIST' | 'VALIDATED' | 'REJECTED' | 'CANCELLED';

/**
 * Type d'admission (Nouvelle inscription ou Réinscription)
 */
export type AdmissionType = 'NEW' | 'RE_ENROLL';

/**
 * Informations d'identité du candidat
 */
export interface Candidate {
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: 'M' | 'F';
  nationality?: string;
  previousSchool?: string;
  requestedLevelId: string;
  requestedClassId?: string;
}

/**
 * Informations sur les responsables (parents/tuteurs)
 */
export interface Guardian {
  role: string; // Père, Mère, Tuteur, etc.
  fullName: string;
  phone: string;
  email?: string;
  profession?: string;
  address: string;
  isPrimary: boolean;
}

/**
 * Résultat de l'évaluation pédagogique (Test)
 */
export interface Assessment {
  grades: Record<string, number>; // ex: { "Maths": 15, "Français": 12 }
  comments?: string;
  decision: 'ADMITTED' | 'ADMITTED_WITH_RESERVATION' | 'REJECTED' | 'WAITLIST';
  recommendedLevelId?: string;
  assessedAt?: string;
}

/**
 * État d'un document requis
 */
export interface RequiredDocument {
  code: string; // EXT, BUL, PHOTO, etc.
  label: string;
  isMandatory: boolean;
  status: 'MISSING' | 'PHYSICAL_RECEIVED' | 'UPLOADED';
  fileUrl?: string;
}

/**
 * Entité principale : Demande d'Admission (Application)
 */
export interface AdmissionApplication {
  id: string;
  reference: string; // ex: ADM-2026-XXXX
  accessCode: string; // Pour le tracking public
  type: AdmissionType;
  status: AdmissionStatus;
  academicYearId: string;
  tenantId: string;
  
  candidate: Candidate;
  guardians: Guardian[];
  documents: RequiredDocument[];
  assessment?: Assessment;
  
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
}

/**
 * REQUÊTES API (Payloads)
 */

export interface ApplicationCreateRequest {
  type: 'NEW';
  academicYearId: string;
  levelId: string;
  filiereId?: string;
}

export interface ReEnrollRequest {
  studentId: string;
  academicYearId: string;
  nextLevelId: string;
}

export interface AssessmentRequest {
  grades: Record<string, number>;
  comments: string;
  decision: string;
  recommendedLevelId?: string;
}

/**
 * CONFIGURATION DU SERVICE (Paramètres École)
 */
export interface EnrollmentConfig {
  isPublicPortalOpen: boolean;
  admissionWindow: {
    startDate: string;
    endDate: string;
  };
  requiredDocuments: {
    code: string;
    label: string;
    isMandatory: boolean;
  }[];
  formSchema?: any; // Format JSONB dynamique
}
