import {AssessmentType, FieldType, RegistrationMode} from './base-types';

// --- CHAMPS ---

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  mandatory: boolean;
  hidden?: boolean;
  preset?: boolean;
  placeholder?: string;
  options?: string[];
}

export interface CoreFieldControl {
  label: string;
}


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
  coreFieldControls: Record<string, CoreFieldControl>;
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

// --- SCHÉMA SERVICES PARASCOLAIRES ---

export interface ServiceConfig {
  code: string;
  label: string;
  options: string[];
  mandatory: boolean;
  preset?: boolean;
}

export interface ServicesSchemaConfig {
  enabled: boolean;
  availableServices: ServiceConfig[];
}

// --- SCHÉMA GLOBAL ---

export interface EnrollmentSchema {
  identity: IdentitySchemaConfig;
  family: FamilySchemaConfig;
  medical: MedicalSchemaConfig;
  schooling: SchoolingSchemaConfig;
  documents: DocumentSchemaConfig;
  assessment: AssessmentSchemaConfig;
  services?: ServicesSchemaConfig;
}

// --- CONFIG NIVEAU (OVERRIDE) ---

export interface LevelOverrideConfig {
  active: boolean;
  maxNewEnrollments?: number | null;
  additionalDocuments?: PresetDocumentConfig[] | null;
  assessment?: AssessmentSchemaConfig | null;
}

// --- CONFIG CYCLE (OVERRIDE) ---

export interface CycleOverrideConfig {
  assessment?: AssessmentSchemaConfig | null;
  additionalDocuments?: PresetDocumentConfig[] | null;
  additionalServices?: ServiceConfig[] | null;
}

// --- CONFIG ANNÉE (OVERRIDE) ---

export interface YearOverrideConfig {
  enrollmentOpen: boolean;
  openFrom?: string | null;
  openUntil?: string | null;
  allowedTypes?: ('NEW_ENROLLMENT' | 'RE_ENROLLMENT')[] | null;
  registrationMode?: RegistrationMode | null;
  welcomeMessage?: string | null;
}

// --- CONFIG GLOBALE ÉTABLISSEMENT ---

export interface EnrollmentConfig {
  tenantId: string;
  portalActive: boolean;
  registrationMode: RegistrationMode;
  schema: EnrollmentSchema;
  levelOverrides: Record<string, LevelOverrideConfig>;
  cycleOverrides?: Record<string, CycleOverrideConfig>;
  instructions: Record<string, string>;
  legalText: string | null;
  enabledServices: string[];
}
