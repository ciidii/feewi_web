import { AdmissionStatus, AdmissionType, DocumentStatus, GuardianRelation } from './base-types';

/** --- PILIER 1 : IDENTITÉ (CANDIDAT) --- */
export interface IdentityPillar {
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: string;
  birthPlace: string;
  nationality?: string;
  customFields?: Record<string, any>;
}

/** --- PILIER 2 : SANTÉ (MÉDICAL) --- */
export interface MedicalPillar {
  bloodGroup?: string;
  criticalAllergies?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  customFields?: Record<string, any>;
}

/** --- PILIER 3 : FAMILLE (RESPONSABLES) --- */
export interface FamilyPillar {
  bundleId: string;
  primaryGuardian: Guardian;
  secondaryGuardian?: Guardian;
  homeAddress: string;
  customFields?: Record<string, any>;
}

/** Informations détaillées sur un responsable */
export interface Guardian {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  profession?: string;
  relation: GuardianRelation;
  isFinancialResponsible: boolean; // Nouveau flag V2
}

/** --- PILIER 4 : SCOLARITÉ (VŒUX & PARCOURS) --- */
export interface SchoolingPillar {
  academicYearId: string;
  levelId: string;
  filiereId?: string | null;
  previousSchool?: string;
  customFields?: Record<string, any>;
}

/** --- ÉVALUATION & DOCUMENTS --- */

export interface Assessment {
  grades: Record<string, number>;
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
  
  // Les 4 Piliers Core
  identity: IdentityPillar;
  medical: MedicalPillar;
  family: FamilyPillar;
  schooling: SchoolingPillar;
  
  // Piliers libres (Extensions spécifiques à l'école)
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
  accessCode: string; // Désormais au niveau du bundle
  family: FamilyPillar;
  admissions: Admission[]; // Liste des enfants
  createdAt: string;
  updatedAt: string;
}

/** 
 * Fallback de compatibilité pour éviter de casser tout le code immédiatement 
 * @deprecated Utilisez 'Admission' ou 'AdmissionBundle'
 */
export type AdmissionApplication = Admission;
