import { AssessmentType } from './base-types';

/** Configuration globale du portail d'admission (Vision Finale V5) */
export interface EnrollmentConfig {
  tenantId: string;
  portalActive: boolean;
  registrationMode: 'PARENT_ONLY' | 'SELF_ONLY' | 'OPEN';
  
  /** Les Piliers configurés (Structure V5) */
  pillars: Record<string, PillarConfig>;
  
  /** Checklist globale (Nom backend : defaultChecklist) */
  defaultChecklist: RequiredDocumentConfig[];
  
  /** Configuration des tests (Nom backend : defaultAssessmentConfig) */
  defaultAssessmentConfig: AssessmentConfig | null;
  
  /** Contrôle temporel */
  yearOverrides: Record<string, any>;
  levelOverrides: Record<string, LevelOverrideConfig>;
  
  instructions: Record<string, string>;
  legalText: string | null;

  /** Alias pour compatibilité Frontend */
  documentChecklist?: RequiredDocumentConfig[]; 
  assessmentConfig?: AssessmentConfig;
}

export interface PillarConfig {
  label: string;
  enabled: boolean;
  systemFields: FieldConfig[];
  customFields: FieldConfig[];
}

export interface FieldConfig {
  name: string;
  label: string;
  type: string;
  mandatory: boolean;
  placeholder?: string;
}

export interface RequiredDocumentConfig {
  code: string;
  name: string;
  mandatory: boolean;
}

export interface AssessmentConfig {
  type: AssessmentType;
  subjectsEnabled: boolean;
  subjects: Record<string, number>; 
  minPassingGrade: number;
}

export interface LevelOverrideConfig {
  active: boolean;
  full: boolean;
  maxNewEnrollments?: number | null;
  documentChecklist?: RequiredDocumentConfig[] | null;
  pillarOverrides?: Record<string, PillarConfig> | null;
  assessmentConfig?: AssessmentConfig | null;
  coreFieldOverrides?: Record<string, any>;
}

/** Fallback compatibilité */
export type RequiredDocumentOld = RequiredDocumentConfig;
