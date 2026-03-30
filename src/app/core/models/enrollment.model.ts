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
 * Résultat de l'évaluation pédagogique (Section 3.3)
 */
export interface Assessment {
  grades: Record<string, number>; // Map<Matière, Note>
  comments?: string;
  decision: string; // ADMITTED | REFUSED | WAITLISTED
  recommendedLevelId?: string;
  assessedAt?: string;
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
 * Entité principale : Demande d'Admission (Section 6.1)
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

// --- PAYLOADS REQUÊTES (Alignement API Parent & Admin) ---

export interface ApplicationCreateRequest {
  tenantId: string;
  type: 'NEW';
  academicYearId: string;
  levelId?: string | null;
  filiereId?: string | null;
  primaryGuardian: Partial<Guardian>;
}

/** Missing Interface 1: Re-Enrollment Request */
export interface ReEnrollRequest {
  studentId: string;
  academicYearId: string;
  nextLevelId: string;
}

/** Missing Interface 2: Candidate Update (PATCH) */
export interface CandidateUpdateRequest {
  info: Partial<Candidate>;
  levelId: string;
  filiereId?: string | null;
}

export interface AssessmentRequest {
  grades: Record<string, number>;
  comments: string;
  decision: string;
  recommendedLevelId?: string;
}

// --- CONFIGURATION (ALIGNEMENT SECTION 4 & 5) ---

export interface AssessmentConfig {
  assessmentType: 'EXAM' | 'DOSSIER' | 'INTERVIEW';
  subjects: string[];
  minPassingGrade: number;
}

export interface EnrollmentConfig {
  tenantId: string;
  portalActive: boolean;

  // Configuration par défaut (Fallback)
  defaultChecklist: RequiredDocumentConfig[];
  defaultCoreOverrides: Record<string, CoreFieldControl>;
  defaultFormSchema: {
    customFields: CustomFieldConfig[];
  };
  defaultAssessmentConfig: AssessmentConfig;

  // Overrides par niveau
  levelOverrides: Record<string, LevelOverrideConfig>;

  // Branding & Expérience
  instructions: Record<string, string>;
  legalText: string;
  enabledServices: string[];

  // Helpers UI (Optionnels)
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

export interface CustomFieldConfig {
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface LevelOverrideConfig {
  documentChecklist: RequiredDocumentConfig[];
  coreFieldOverrides: Record<string, CoreFieldControl>;
  formSchema: {
    customFields: CustomFieldConfig[];
  };
  assessmentConfig?: AssessmentConfig;
}
