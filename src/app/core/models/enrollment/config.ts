import { AssessmentType } from './base-types';

/** Configuration globale du portail d'admission (Vision V5) */
export interface EnrollmentConfig {
  tenantId: string;
  portalActive: boolean;
  registrationMode: 'PARENT_ONLY' | 'SELF_ONLY' | 'OPEN';
  academicYearLabel: string;
  
  /** Les Piliers configurés */
  pillars: Record<string, PillarConfig>;
  
  /** Checklist globale */
  documentChecklist: RequiredDocumentConfig[];
  
  /** Configuration des tests de niveau (V5) */
  assessmentConfig: AssessmentConfig;
  
  /** Contrôle temporel : Verrous par année scolaire (V5) */
  yearOverrides: Record<string, YearOverrideConfig>;
  
  /** Surcharges par niveau (V5) */
  levelOverrides: Record<string, LevelOverrideConfig>;
  
  instructions: Record<string, string>;
  legalText: string;
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
  type: 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN';
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
  subjects: Record<string, number>; // Matière -> Coefficient
  minPassingGrade: number;
}

export interface YearOverrideConfig {
  active: boolean; // Si l'année est visible/sélectionnable sur le portail
  registrationEndDate?: string;
}

export interface LevelOverrideConfig {
  active: boolean;
  full: boolean;
  maxNewEnrollments?: number;
  pillarOverrides?: Record<string, PillarConfig>;
  assessmentConfig?: AssessmentConfig;
}

/** @deprecated */
export type CustomFieldConfig = FieldConfig;
export type CoreFieldControl = FieldConfig;
