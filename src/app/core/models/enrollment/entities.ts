import { AdmissionStatus, AdmissionType, DocumentStatus, GuardianRelation } from './base-types';

/** Informations d'identité du candidat (Élève) */
export interface Candidate {
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: string;
  birthPlace: string;
  nationality?: string;
  previousSchool?: string;
}

/** Informations sur les responsables légaux */
export interface Guardian {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  profession?: string;
  relation: GuardianRelation;
  address: string;
}

/** Résultat de l'évaluation pédagogique par la commission */
export interface Assessment {
  grades: Record<string, number>;
  comments?: string;
  decision: string;
  recommendedLevelId?: string;
  assessedAt?: string;
}

/** Représentation d'un document réel dans un dossier */
export interface RequiredDocument {
  code: string;
  name: string;
  mandatory: boolean;
  status: DocumentStatus;
  fileUrl?: string;
}

/** Entité Centrale : Demande d'Admission */
export interface AdmissionApplication {
  id: string;
  reference: string;
  accessCode: string;
  type: AdmissionType;
  status: AdmissionStatus;
  wish: {
    academicYearId: string;
    levelId: string;
    filiereId?: string | null;
  };
  tenantId: string;
  candidate?: Candidate;
  primaryGuardian?: Guardian;
  documents: RequiredDocument[];
  assessment?: Assessment;
  trackerMessage: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
}
