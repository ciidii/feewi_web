import { AdmissionType } from './base-types';
import { IdentityPillar, MedicalPillar, SchoolingPillar, FamilyPillar, AdmissionBundle, Admission, Guardian } from './entities';
import { PillarConfig, RequiredDocumentConfig } from './config';

/** --- PORTAIL PUBLIC (Landing & Config) --- */

export interface PublicPortalSummary {
  tenantId: string;
  portalActive: boolean;
  registrationMode: 'PARENT_ONLY' | 'ASSISTED' | 'OPEN';
  academicYearLabel: string;
  withinDates: boolean;
  registrationStartDate: string;
  registrationEndDate: string;
  enabledServices: string[];
  welcomeMessage?: string; // Rajouté pour le Landing
  /** Statut temps-réel des niveaux */
  levelStatuses: Record<string, { active: boolean, full: boolean }>;
}

/** Réponse pour le générateur de formulaire dynamique */
export interface EffectiveConfigResponse {
  /** Liste des piliers avec leurs libellés et champs personnalisés */
  pillars: Record<string, PillarConfig>;
  /** Pièces justificatives finales (Global + Surcharges) */
  documentChecklist: RequiredDocumentConfig[];
  /** Instructions par étape */
  instructions?: Record<string, string>;
}

/** --- REQUESTS --- */

export interface CreateBundleRequest {
  tenantId: string;
  family: {
    primaryGuardian: Partial<Guardian>;
    secondaryGuardian?: Partial<Guardian>;
    homeAddress: string;
    customFields?: Record<string, any>;
  };
  children: Array<{
    firstName: string;
    lastName: string;
    gender: 'MALE' | 'FEMALE';
    academicYearId: string;
    levelId: string;
    filiereId?: string | null;
  }>;
}

export interface ReEnrollRequest {
  studentId: string;
  academicYearId: string;
  nextLevelId: string;
  filiereId?: string | null;
}

export interface AssessmentRequest {
  grades: Record<string, number>;
  comments: string;
  decision: string;
  recommendedLevelId?: string;
}

export interface FastEntryRequest {
  tenantId: string;
  academicYearId: string;
  family: Partial<FamilyPillar>;
  identity: IdentityPillar;
  medical?: MedicalPillar;
  schooling: SchoolingPillar;
}

/** --- RESPONSES --- */

export interface AdmissionBundleResponse extends AdmissionBundle {}

export interface AdmissionPageResponse {
  content: Admission[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

/** @deprecated */
export interface ApplicationCreateRequest extends CreateBundleRequest {}
export interface CandidateUpdateRequest {
  info: Partial<IdentityPillar>;
  levelId: string;
  filiereId?: string | null;
}
