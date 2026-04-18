import { AdmissionStatus, AdmissionType, AdmissionChannel, DocumentStatus, GuardianRelation, CycleType } from './base-types';

// --- PILIER IDENTITÉ ---

export interface IdentityPillar {
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: string;
  birthPlace: string;
  customFields?: Record<string, any>;
}

// --- PILIER MÉDICAL ---
// Tous les champs (bloodGroup, criticalAllergies, emergencyContact*)
// transitent via customFields — définis par la config école

export interface MedicalPillar {
  customFields?: Record<string, any>;
}

// --- PILIER FAMILLE ---
// homeAddress transite via customFields

export interface FamilyPillar {
  primaryGuardian: Guardian;
  secondaryGuardian?: Guardian;
  customFields?: Record<string, any>;
}

export interface Guardian {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  relation: GuardianRelation;
  financialResponsible: boolean;
  customFields?: Record<string, any>;
}

// --- PILIER SCOLARITÉ ---

export interface SchoolingPillar {
  academicYearId: string;
  levelId: string;
  levelLabel?: string;
  filiereId?: string | null;
  cycleType?: CycleType;
  customFields?: Record<string, any>;
}

// --- DOCUMENTS & ÉVALUATION ---

export interface RequiredDocument {
  code: string;
  name: string;
  mandatory: boolean;
  status: DocumentStatus;
  fileUrl?: string | null;
}

export interface Assessment {
  grades: Record<string, number>;
  averageGrade?: number;
  comments?: string;
  decision?: string;
  recommendedLevelId?: string | null;
  assessedAt?: string;
}

export interface ServiceSubscription {
  serviceCode: string;
  optionCode: string;
}

// --- ADMISSION (ENFANT) ---

export interface Admission {
  id: string;
  bundleId: string;
  reference: string;
  type: AdmissionType;
  channel: AdmissionChannel;
  status: AdmissionStatus;

  identity: IdentityPillar;
  medical: MedicalPillar;
  schooling: SchoolingPillar;

  documents: RequiredDocument[];
  subscriptions?: ServiceSubscription[];
  assessment?: Assessment | null;
  trackerMessage: string;
  /** Résolu depuis le bundle par l'endpoint admin /details */
  primaryGuardian?: Guardian;

  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
}

// --- BUNDLE (FAMILLE) ---

export interface AdmissionBundle {
  id: string;
  reference: string;
  accessCode: string;
  status: AdmissionStatus;
  family: FamilyPillar;
  admissions: Admission[];
  createdAt: string;
}
