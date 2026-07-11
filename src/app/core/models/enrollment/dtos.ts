import {AcademicYearState, AdmissionType, CycleType, RegistrationMode} from './base-types';
import {Admission, AdmissionBundle, Guardian} from './entities';
import {EnrollmentSchema} from './config';

// --- PORTAIL PUBLIC ---

export interface AvailableYearSummary {
  id: string;
  label: string;
  state: AcademicYearState;
  startDate: string;
  endDate: string;
  active: boolean;
  allowedTypes: AdmissionType[];
  registrationMode: RegistrationMode;
  welcomeMessage?: string;
  levelStatuses: Record<string, { active: boolean; full: boolean }>;
}

export interface PublicPortalSummary {
  tenantId: string;
  portalActive: boolean;
  legalText?: string;
  availableYears: AvailableYearSummary[];
}

// --- CONFIG EFFECTIVE ---

export interface DefaultConfigResponse {
  portalActive: boolean;
  registrationMode: RegistrationMode;
  schema: EnrollmentSchema;
  instructions: Record<string, string>;
  legalText?: string;
}

export interface LevelConfigResponse extends DefaultConfigResponse {
  levelId: string;
}

// --- REQUESTS PORTAIL PARENT ---

export interface CreateBundleRequest {
  tenantId: string;
  family: {
    primaryGuardian: {
      firstName: string;
      lastName: string;
      email?: string;
      phone: string;
      relation: string;
      financialResponsible: boolean;
      customFields?: Record<string, any>;
    };
    secondaryGuardian?: Partial<Guardian>;
    customFields?: Record<string, any>;
  };
}

export interface AddChildRequest {
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE';
  type: AdmissionType;
  academicYearId: string;
  levelId: string;
  filiereId?: string | null;
  cycleType?: CycleType;
}

export interface ServiceSubscriptionRequest {
  serviceCode: string;
  optionCode: string;
}

export interface ReEnrollRequest {
  tenantId: string;
  studentId: string;
  academicYearId: string;
  nextLevelId: string;
}

export interface ReEnrollEligibilityResponse {
  eligible: boolean;
  reason?: string;
  /** Code machine stable (depuis le 2026-07-11), en complément additif de `reason` */
  reasonCode?: 'STUDENT_NOT_FOUND' | 'STUDENT_ARCHIVED' | 'STUDENT_LEFT' | 'STUDENT_SUSPENDED' | 'STUDENT_STATUS_OTHER' | 'ALREADY_HAS_ACTIVE_REENROLLMENT';
}

// --- REQUESTS ADMIN ---

export interface AssessmentRequest {
  grades: Record<string, number>;
  comments: string;
  decision?: 'ADMITTED' | 'REJECTED' | null;
  recommendedLevelId?: string | null;
}

export interface DirectEntryRequest {
  tenantId: string;
  type: AdmissionType;
  academicYearId: string;
  levelId: string;
  identity: {
    firstName: string;
    lastName: string;
    gender: 'MALE' | 'FEMALE';
    birthDate: string;
    birthPlace: string;
    customFields?: Record<string, any>;
  };
  primaryGuardian: {
    firstName: string;
    lastName: string;
    phone: string;
    relation: string;
    financialResponsible: boolean;
    customFields?: Record<string, any>;
  };
}

// --- RESPONSES ---

export interface AdmissionBundleResponse extends AdmissionBundle {}

export interface AdmissionPageResponse {
  content: Admission[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
