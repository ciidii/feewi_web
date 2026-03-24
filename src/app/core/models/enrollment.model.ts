/**
 * États possibles d'un dossier d'admission
 */
export type AdmissionStatus = 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'TESTING' | 'WAITLIST' | 'VALIDATED' | 'REJECTED' | 'CANCELLED';

/**
 * Type d'admission (Nouvelle inscription ou Réinscription)
 */
export type AdmissionType = 'NEW' | 'RE_ENROLL';

/**
 * Payload pour la mise à jour du candidat (PATCH /candidate)
 */
export interface CandidateUpdateRequest {
  info: {
    firstName: string;
    lastName: string;
    gender: 'MALE' | 'FEMALE';
    birthDate: string;
    birthPlace: string;
    nationality?: string;
    previousSchool?: string;
  };
  levelId: string;
  filiereId?: string | null;
}

/**
 * Informations d'identité du candidat (pour l'affichage)
 */
export interface Candidate {
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: string;
  birthPlace: string;
  nationality?: string;
  previousSchool?: string;
}

/**
 * Informations sur les responsables (parents/tuteurs)
 */
export interface Guardian {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  profession?: string;
  relation: 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'OTHER';
  address: string
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
  code: string; // ex: 'EXT'
  name: string; // ex: 'Extrait de Naissance'
  mandatory: boolean;
  status: 'MISSING' | 'PHYSICAL_RECEIVED' | 'UPLOADED';
  fileUrl?: string;
}

/**
 * Entité principale : Demande d'Admission (Application)
 */
export interface AdmissionApplication {
  id: string;
  reference: string;
  accessCode: string;
  type: AdmissionType;
  status: AdmissionStatus;
  academicYearId: string;
  tenantId: string;

  candidate: Candidate;
  primaryGuardian: Guardian;
  documents: RequiredDocument[];
  assessment?: Assessment;

  trackerMessage: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
}
/**
 * REQUÊTES API (Payloads)
 */

export interface ApplicationCreateRequest {
  tenantId: string;
  type: 'NEW';
  academicYearId: string;
  levelId?: string | null;
  filiereId?: string | null;
  primaryGuardian: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    relation: 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'OTHER';
  }
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
