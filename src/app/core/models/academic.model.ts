export type YearStatus = 'PLANNING' | 'ACTIVE' | 'CLOSING' | 'ARCHIVED';
export type AcademicSystemType = 'TRIMESTER' | 'SEMESTER' | 'ANNUAL';

export interface AcademicYear {
  id: string;
  label: string;
  status: YearStatus;
  systemType: AcademicSystemType;
  adminStartDate: string;
  adminEndDate: string;
  lessonsStartDate: string;
  lessonsEndDate: string;
  registrationStartDate?: string;
  registrationEndDate?: string;
  createdAt?: string;
}

export interface Period {
  id: string;
  yearId: string;
  label: string;
  startDate: string;
  endDate: string;
  examStartDate: string;
  examEndDate: string;
  gradingDeadline: string;
}

export interface Holiday {
  id: string;
  yearId: string;
  label: string;
  startDate: string;
  endDate: string;
  schoolClosed: boolean;
}

export interface Cycle {
  id: string;
  name: string;
  rank: number;
}

export interface Level {
  id: string;
  name: string;
  rank: number;
  cycleId: string;
  cycle?: Cycle;
}

export interface ClassInstance {
  id: string;
  name: string;
  capacity: number;
  levelId: string;
  yearId: string;
  level?: Level;
}

export interface CreateYearRequest {
  label: string;
  systemType: AcademicSystemType;
  adminStartDate: string;
  adminEndDate: string;
  lessonsStartDate: string;
  lessonsEndDate: string;
}
