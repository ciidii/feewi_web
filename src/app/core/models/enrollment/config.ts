import { AssessmentType, FieldType, RegistrationMode } from './base-types';

// --- CHAMPS ---

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  mandatory: boolean;
  preset?: boolean;
  placeholder?: string;
}

export interface CoreFieldControl {
  label: string;
}

// --- SCHÉMA PAR PILIER ---

export interface IdentitySchemaConfig {
  coreFieldControls: Record<string, CoreFieldControl>;
  customFields: FieldConfig[];
}

export interface FamilySchemaConfig {
  enabled: boolean;
  allowedWithoutGuardian: boolean;
  guardianCoreFieldControls: Record<string, CoreFieldControl>;
  guardianCustomFields: FieldConfig[];
}

export interface MedicalSchemaConfig {
  enabled: boolean;
  customFields: FieldConfig[];
}

export interface SchoolingSchemaConfig {
  enabled: boolean;
  customFields: FieldConfig[];
}

export interface DocumentSchemaConfig {
  enabled: boolean;
  presetDocuments: PresetDocumentConfig[];
}

export interface PresetDocumentConfig {
  code: string;
  name: string;
  mandatory: boolean;
}

export interface AssessmentSchemaConfig {
  type: AssessmentType;
  subjects: Record<string, number>;
  maxGrade: number;
  minPassingGrade: number;
}

// --- SCHÉMA GLOBAL ---

export interface EnrollmentSchema {
  identity: IdentitySchemaConfig;
  family: FamilySchemaConfig;
  medical: MedicalSchemaConfig;
  schooling: SchoolingSchemaConfig;
  documents: DocumentSchemaConfig;
  assessment: AssessmentSchemaConfig;
}

// --- CONFIG NIVEAU (OVERRIDE) ---

export interface LevelOverrideConfig {
  active: boolean;
  maxNewEnrollments?: number | null;
  documentChecklist?: PresetDocumentConfig[] | null;
  assessmentConfig?: AssessmentSchemaConfig | null;
}

// --- CONFIG GLOBALE ÉTABLISSEMENT ---

export interface EnrollmentConfig {
  tenantId: string;
  portalActive: boolean;
  registrationMode: RegistrationMode;
  schema: EnrollmentSchema;
  levelOverrides: Record<string, LevelOverrideConfig>;
  instructions: Record<string, string>;
  legalText: string | null;
  enabledServices: string[];
}
