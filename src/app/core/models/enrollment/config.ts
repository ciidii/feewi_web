import { AssessmentType } from './base-types';

/** Configuration globale du portail d'admission (Vision V3) */
export interface EnrollmentConfig {
  tenantId: string;
  portalActive: boolean;
  registrationMode: 'PARENT_ONLY' | 'ASSISTED' | 'OPEN';
  academicYearLabel: string;
  
  /** Les Piliers configurés (pillar_identity, pillar_medical, etc.) */
  pillars: Record<string, PillarConfig>;
  
  /** Checklist globale par défaut */
  documentChecklist: RequiredDocumentConfig[];
  
  /** Paramètres par défaut pour les tests de niveau */
  defaultAssessmentConfig: AssessmentConfig;
  
  /** Surcharges (Fermeture de niveau, Quotas) */
  levelOverrides: Record<string, LevelOverrideConfig>;

  /** Textes CMS (Rajoutés pour le Frontend) */
  instructions: Record<string, string>;
  legalText: string;
}

export interface PillarConfig {
  label: string;
  customFields: CustomFieldConfig[];
  coreFields?: Record<string, FieldControl>;
}

export interface CustomFieldConfig {
  name: string;
  label: string;
  type: 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN';
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface RequiredDocumentConfig {
  code: string;
  name: string;
  mandatory: boolean;
}

export interface FieldControl {
  label: string;
  hidden: boolean;
  mandatory: boolean;
}

export interface AssessmentConfig {
  type: AssessmentType;
  subjects: string[];
  minPassingGrade: number;
}

export interface LevelOverrideConfig {
  active: boolean;
  full: boolean;
  maxNewEnrollments?: number;
  documentChecklist?: RequiredDocumentConfig[];
  assessmentConfig?: AssessmentConfig;
}

/** @deprecated */
export type CoreFieldControl = FieldControl;
