export type AdmissionStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'VERIFIED'
  | 'TESTING'
  | 'ADMITTED'
  | 'WAITLIST'
  | 'VALIDATED'
  | 'REJECTED'
  | 'CANCELLED';

export type AdmissionType = 'NEW_ENROLLMENT' | 'RE_ENROLLMENT';

export type AdmissionChannel = 'DIGITAL' | 'DIRECT';

export type GuardianRelation = 'FATHER' | 'MOTHER' | 'UNCLE' | 'AUNT' | 'GRANDPARENT' | 'GUARDIAN' | 'OTHER';

export type DocumentStatus = 'MISSING' | 'UPLOADED' | 'RECEIVED' | 'VERIFIED' | 'REJECTED';

export type AssessmentType = 'EXAM' | 'DOSSIER' | 'INTERVIEW' | 'MIXED';

export type AssessmentDecision = 'ADMITTED' | 'ADMITTED_WITH_RESERVE' | 'REJECTED';

export type RegistrationMode = 'PARENT_ONLY' | 'ADMIN_ONLY' | 'BOTH';

export type FieldType = 'TEXT' | 'TEXTAREA' | 'DATE' | 'SELECT' | 'BOOLEAN' | 'NUMBER';

export type CycleType = 'MATERNAL' | 'PRIMARY' | 'MIDDLE_SCHOOL' | 'HIGH_SCHOOL';

export type AcademicYearState = 'PLANNING' | 'ACTIVE' | 'CLOSED';
