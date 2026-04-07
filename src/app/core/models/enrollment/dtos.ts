import { AdmissionType } from './base-types';
import { IdentityPillar, MedicalPillar, SchoolingPillar, FamilyPillar, AdmissionBundle, Admission } from './entities';
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
  /** Statut temps-réel des niveaux (pour désactiver le choix dans le formulaire) */
  levelStatuses: Record<string, { active: boolean, full: boolean }>;
}

/** Réponse pour le générateur de formulaire dynamique */
export interface EffectiveConfigResponse {
  /** Liste des piliers avec leurs libellés et champs personnalisés */
  pillars: Record<string, PillarConfig>;
  /** Pièces justificatives finales (Global + Surcharges) */
  documentChecklist: RequiredDocumentConfig[];
}

/** --- REQUESTS (POST / PUT / PATCH) --- */

export interface CreateBundleRequest {
  tenantId: string;
  family: {
    primaryGuardian: Partial<FamilyPillar['primaryGuardian']>;
    secondaryGuardian?: Partial<FamilyPillar['secondaryGuardian']>;
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

/** --- RESPONSES --- */

export interface AdmissionBundleResponse extends AdmissionBundle {}

export interface AdmissionPageResponse {
  content: Admission[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
