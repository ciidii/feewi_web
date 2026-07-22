import {AcademicYearState, AdmissionType, CycleType, RegistrationMode} from './base-types';
import {Admission, AdmissionBundle, Guardian} from './entities';
import {EnrollmentSchema, PresetDocumentConfig} from './config';

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
  /** Checklist des pièces requises, mergée base → cycle → niveau (source de la checklist guichet). */
  documentChecklist?: PresetDocumentConfig[];
  instructions: Record<string, string>;
  legalText?: string;
}

export interface LevelConfigResponse extends DefaultConfigResponse {
  levelId: string;
}

// --- REQUESTS PORTAIL PARENT ---

export interface CreateBundleRequest {
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

/**
 * Saisie directe au guichet (Secrétariat) — dossier complet aligné sur le formulaire configuré
 * par l'école (piliers activés + customFields). Le backend prend le tenant depuis le JWT
 * (`tenantId` ci-dessous est ignoré, conservé pour compat) et force le canal `DIRECT`.
 */
export interface DirectEntryRequest {
  /** @deprecated ignoré côté backend — le tenant provient du JWT. */
  tenantId?: string;
  type: AdmissionType;
  academicYearId: string;
  levelId: string;
  filiereId?: string | null;
  /** Cycle du niveau — résout les overrides de config par cycle côté backend. */
  cycleType?: CycleType;
  identity: {
    firstName: string;
    lastName: string;
    gender: 'MALE' | 'FEMALE';
    birthDate: string;
    birthPlace: string;
    /** Champs personnalisés du pilier identité configurés par l'école (ex: nationality). */
    customFields?: Record<string, any>;
  };
  /** Pilier médical — omis si désactivé dans le schéma de l'école. */
  medical?: {
    customFields?: Record<string, any>;
  };
  /** Champs personnalisés du pilier scolarité (ex: previousSchool). */
  schoolingCustomFields?: Record<string, any>;
  primaryGuardian: {
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    relation: string;
    financialResponsible: boolean;
    /** Champs personnalisés sur le tuteur (guardianCustomFields). */
    customFields?: Record<string, any>;
  };
  /** Champs personnalisés du pilier famille (ex: homeAddress). */
  familyCustomFields?: Record<string, any>;
  /** Piliers entièrement personnalisés définis par l'école (clé pilier → valeurs). */
  extraPillars?: Record<string, Record<string, any>>;
  /** Codes des pièces remises au guichet → PHYSICAL_RECEIVED ; les autres restent MISSING. */
  receivedDocumentCodes?: string[];
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
