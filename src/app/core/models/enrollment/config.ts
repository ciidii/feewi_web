import { AssessmentType } from './base-types';

/** Configuration globale du portail d'admission */
export interface EnrollmentConfig {
  tenantId: string;
  portalActive: boolean;
  admissionWindow?: {
    startDate: string;
    endDate: string;
  };
  defaultChecklist: RequiredDocumentConfig[];
  defaultCoreOverrides: Record<string, CoreFieldControl>;
  defaultFormSchema: FormSchemaConfig;
  defaultAssessmentConfig: AssessmentConfig;
  levelOverrides: Record<string, LevelOverrideConfig>;
  instructions: Record<string, string>;
  legalText: string;
  enabledServices: string[];
}

export interface RequiredDocumentConfig {
  code: string;
  name: string;
  mandatory: boolean;
}

export interface CoreFieldControl {
  label: string;
  hidden: boolean;
  mandatory: boolean;
}

export interface FormSchemaConfig {
  customFields?: CustomFieldConfig[];
}

export interface CustomFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface AssessmentConfig {
  type: AssessmentType;
  subjects: string[];
  minPassingGrade: number;
}

export interface LevelOverrideConfig {
  documentChecklist?: RequiredDocumentConfig[];
  coreFieldOverrides?: Record<string, CoreFieldControl>;
  formSchema?: FormSchemaConfig;
  assessmentConfig?: AssessmentConfig;
}
