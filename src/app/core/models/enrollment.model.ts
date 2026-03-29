

/**
 * États possibles d'un dossier d'admission
 */
export type AdmissionStatus = 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'TESTING' | 'WAITLIST' | 'VALIDATED' | 'REJECTED' | 'CANCELLED';

/**
 * Type d'admission
 */
export type AdmissionType = 'NEW' | 'RE_ENROLL';

/**
 * Informations d'identité du candidat
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
 * Informations sur les responsables
 */
export interface Guardian {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  profession?: string;
  relation: 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'OTHER';
  address: string;
}

/**
 * Résultat de l'évaluation pédagogique
 */
export interface Assessment {
  grades: Record<string, number>;
  comments?: string;
  decision: string;
  recommendedLevelId?: string;
}

/**
 * État d'un document requis
 */
export interface RequiredDocument {
  code: string;
  name: string;
  mandatory: boolean;
  status: 'MISSING' | 'PHYSICAL_RECEIVED' | 'UPLOADED';
  fileUrl?: string;
}

/**
 * Entité principale : Dossier d'admission (Application)
 */
export interface AdmissionApplication {
  id: string;
  reference: string;
  accessCode: string;
  type: AdmissionType;
  status: AdmissionStatus;
  academicYearId: string;
  levelId: string;
  filiereId?: string | null;
  tenantId: string;
  candidate?: Candidate;
  primaryGuardian?: Guardian;
  documents: RequiredDocument[];
  assessment?: Assessment;
  trackerMessage: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
}

// --- PAYLOADS REQUÊTES ---

export interface ApplicationCreateRequest {
  tenantId: string;
  type: 'NEW';
  academicYearId: string;
  levelId?: string | null;
  filiereId?: string | null;
  primaryGuardian: Partial<Guardian>;
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

export interface CandidateUpdateRequest {
  info: Partial<Candidate>;
  levelId: string;
  filiereId?: string | null;
}

// --- CONFIGURATION (ALIGNEMENT JAVA) ---

export interface EnrollmentConfig {
  tenantId: string;
  portalActive: boolean;

  // Configuration par défaut
  defaultChecklist: RequiredDocumentConfig[];
  defaultCoreOverrides: Record<string, CoreFieldControl>;
  defaultFormSchema: Record<string, any>;

  // Overrides par niveau
  levelOverrides: Record<string, LevelOverrideConfig>;

  // Branding & Expérience
  instructions: Record<string, string>; // Map<String, String> en Java
  legalText: string;
  enabledServices: string[];

  // Helpers UI (Non envoyés au Backend ou gérés à part)
  admissionWindow?: {
    startDate: string;
    endDate: string;
  };
}

export interface RequiredDocumentConfig {
  code: string;
  name: string;
  mandatory: boolean;
}

export interface CoreFieldControl {
  label: string;
  hidden: boolean;
  mandatory: boolean;
}

export interface LevelOverrideConfig {
  documentChecklist: RequiredDocumentConfig[];
  coreFieldOverrides: Record<string, CoreFieldControl>;
  formSchema: Record<string, any>;
}
