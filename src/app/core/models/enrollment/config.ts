import { AssessmentType } from './base-types';

/** Configuration globale du portail d'admission (Vision V4) */
export interface EnrollmentConfig {
  tenantId: string;
  portalActive: boolean;
  registrationMode: 'PARENT_ONLY' | 'SELF_ONLY' | 'OPEN';
  academicYearLabel: string;
  
  /** Les Piliers configurés (Identité, Santé, Famille, Scolarité) */
  pillars: Record<string, PillarConfig>;
  
  /** Checklist globale */
  documentChecklist: RequiredDocumentConfig[];
  
  /** Configuration des tests de niveau (V4) */
  assessmentConfig: AssessmentConfig;
  
  levelOverrides: Record<string, LevelOverrideConfig>;
  instructions: Record<string, string>;
  legalText: string;
}

/** Structure d'un Pilier thématique */
export interface PillarConfig {
  label: string;
  /** Champs indispensables au moteur Feewi (Libellé modifiable) */
  systemFields: FieldConfig[];
  /** Champs libres créés par l'établissement (Totalement éditables) */
  customFields: FieldConfig[];
}

/** Définition d'un champ (Système ou CMS) */
export interface FieldConfig {
  name: string;
  label: string;
  type: 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN';
  mandatory: boolean;
  placeholder?: string;
  options?: string[]; // Pour évolutions futures
}

export interface RequiredDocumentConfig {
  code: string;
  name: string;
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
}

/** @deprecated Fallback pour composants non migrés */
export type CustomFieldConfig = FieldConfig;
export type CoreFieldControl = FieldConfig;
