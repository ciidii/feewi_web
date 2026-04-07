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
}

export interface PillarConfig {
  label: string;
  /** Champs personnalisés ajoutés par l'école dans ce pilier */
  customFields: CustomFieldConfig[];
  /** Règles sur les champs système (optionnel dans la V3) */
  coreFields?: Record<string, FieldControl>;
}

export interface CustomFieldConfig {
  name: string;
  label: string;
  type: 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN'; // Normalisation V3
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
