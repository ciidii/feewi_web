import { AdmissionType, AssessmentType } from './base-types';
import { Candidate, Guardian } from './entities';

export interface ApplicationCreateRequest {
  tenantId: string;
  type: 'NEW';
  academicYearId: string;
  levelId?: string | null;
  filiereId?: string | null;
  primaryGuardian: Partial<Guardian>;
}

export interface ReEnrollRequest {
  studentId: string;
  academicYearId: string;
  nextLevelId: string;
  filiereId?: string | null;
}

export interface CandidateUpdateRequest {
  info: Partial<Candidate>;
  levelId: string;
  filiereId?: string | null;
}

export interface AssessmentRequest {
  grades: Record<string, number>;
  comments: string;
  decision: string;
  recommendedLevelId?: string;
}
