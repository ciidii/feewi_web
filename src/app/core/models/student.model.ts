/**
 * Référentiel Élèves (Student Registry)
 * Basé sur STUDENT_REGISTRY_API_REFERENCE.md
 */

export type StudentStatus = 'ACTIVE' | 'SUSPENDED' | 'LEFT' | 'ARCHIVED';
export type Gender = 'M' | 'F';

export interface StudentSummary {
  id: string;
  registrationNumber: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  birthDate: string;
  status: StudentStatus;
  customFields?: Record<string, any>;
}

export interface GuardianLink {
  guardianEmail: string;
  relation: string;
  financialResponsible: boolean;
}

export interface SchoolingHistory {
  academicYearId: string;
  levelId: string;
  result: 'ADMITTED' | 'REJECTED' | 'PROMOTED' | 'REPEATED';
  yearLabel?: string;
  levelName?: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface StudentResponse extends StudentSummary {
  bloodGroup?: string;
  criticalAllergies?: string;
  emergencyContact?: EmergencyContact;
  guardians: GuardianLink[];
  history: SchoolingHistory[];
}

export interface UpdateStudentRequest {
  bloodGroup?: string;
  criticalAllergies?: string;
  status?: StudentStatus;
  customFields?: Record<string, any>;
}
