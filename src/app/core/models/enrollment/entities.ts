import { AdmissionStatus, AdmissionType, DocumentStatus, GuardianRelation } from './base-types';

/** --- PILIER 1 : IDENTITÉ (CANDIDAT) --- */
export interface IdentityPillar {
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: string;
  birthPlace: string;
  nationality?: string;
  /** Champs CMS spécifiques au pilier Identité */
  customFields?: Record<string, any>;
}

/** --- PILIER 2 : SANTÉ (MÉDICAL) --- */
export interface MedicalPillar {
  bloodGroup?: string;
  criticalAllergies?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  /** Champs CMS spécifiques au pilier Médical */
  customFields?: Record<string, any>;
}

/** --- PILIER 3 : FAMILLE (RESPONSABLES) --- */
export interface FamilyPillar {
  primaryGuardian: Guardian;
  secondaryGuardian?: Guardian;
  homeAddress: string;
  /** Champs CMS spécifiques au pilier Famille */
  customFields?: Record<string, any>;
}

export interface Guardian {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  profession?: string;
  relation: GuardianRelation;
  isFinancialResponsible: boolean;
}

/** --- PILIER 4 : SCOLARITÉ (VŒUX & PARCOURS) --- */
export interface SchoolingPillar {
  academicYearId: string;
  levelId: string;
  filiereId?: string | null;
  previousSchool?: string;
  /** Champs CMS spécifiques au pilier Scolarité */
  customFields?: Record<string, any>;
}

/** --- ÉVALUATION & DOCUMENTS --- */

export interface Assessment {
  grades: Record<string, number>;
  averageGrade?: number; // Calculé par le backend V5
  comments?: string;
  decision: string;
  recommendedLevelId?: string;
  assessedAt?: string;
}

export interface RequiredDocument {
  code: string;
  name: string;
  mandatory: boolean;
  status: DocumentStatus;
  fileUrl?: string;
}

/** --- ENTITÉ BRANCHE : ADMISSION INDIVIDUELLE --- */
export interface Admission {
  id: string;
  bundleId: string;
  reference: string;
  status: AdmissionStatus;
  type: AdmissionType;
  tenantId: string;
  
  identity: IdentityPillar;
  medical: MedicalPillar;
  family: FamilyPillar;
  schooling: SchoolingPillar;
  
  extraPillars?: Record<string, any>;
  
  documents: RequiredDocument[];
  assessment?: Assessment;
  trackerMessage: string;
  
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
}

/** --- ENTITÉ TRONC : BUNDLE FAMILIAL --- */
export interface AdmissionBundle {
  id: string;
  tenantId: string;
  reference: string; // Ajouté (ex: FAM-2026-XXXX)
  accessCode: string;
  family: FamilyPillar;
  admissions: Admission[];
  createdAt: string;
  updatedAt: string;
}

/** @deprecated Fallback pour compatibilité */
export type AdmissionApplication = Admission;
