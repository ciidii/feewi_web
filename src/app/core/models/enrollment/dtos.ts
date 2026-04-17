import { AdmissionType, RegistrationMode } from './base-types';
import { AdmissionBundle, Admission, Guardian } from './entities';
import { EnrollmentSchema, PresetDocumentConfig, AssessmentSchemaConfig } from './config';

// --- PORTAIL PUBLIC ---

export interface PublicPortalSummary {
  tenantId: string;
  portalActive: boolean;
  registrationMode: RegistrationMode;
  availableYears: Array<{
    id: string;
    label: string;
    registrationStartDate: string;
    registrationEndDate: string;
    active: boolean;
  }>;
  welcomeMessage?: string;
  legalText?: string;
  enabledServices: string[];
  levelStatuses: Record<string, { active: boolean; full: boolean }>;
}

// --- CONFIG EFFECTIVE ---

export interface DefaultConfigResponse {
  portalActive: boolean;
  registrationMode: RegistrationMode;
  schema: EnrollmentSchema;
  documentChecklist: PresetDocumentConfig[];
  assessmentConfig: AssessmentSchemaConfig;
  instructions: Record<string, string>;
  enabledServices: string[];
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
}

export interface ServiceSubscriptionRequest {
  serviceCode: string;
  option: string;
}

export interface ReEnrollRequest {
  tenantId: string;
  studentId: string;
  academicYearId: string;
  nextLevelId: string;
}

// --- REQUESTS ADMIN ---

export interface AssessmentRequest {
  grades: Record<string, number>;
  comments: string;
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
