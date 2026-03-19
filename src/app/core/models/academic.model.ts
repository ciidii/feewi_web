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
  cycleCode: string;   // Code système (ex: PRIMARY)
  systemName: string;  // Nom par défaut (ex: Élémentaire)
  customName?: string; // Nom personnalisé par l'école
  active: boolean;
  rank: number;
}

export interface Level {
  id: string;
  name: string;
  rank: number;
  cycleId: string;
  cycle?: Cycle;
}

export interface Filiere {
  id: string;
  name: string;
  code: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  isProvisioned: boolean; // True si vient du modèle national, False si créé par l'école
}

export interface CurriculumItem {
  id: string;
  levelId: string;
  filiereId?: string | null;
  subjectId: string;
  subjectName?: string; // Reconstruit
  defaultCoefficient: number;
  weeklyHours: number; // Nouveau : Volume horaire hebdo
  maxScore: number;
  optional: boolean;
}

export interface SyllabusDomain {
  id: string;
  name: string;
  rank: number;
  chapters?: SyllabusChapter[]; // Cascade V3
}

export interface SyllabusChapter {
  id: string;
  domainId: string;
  name: string;
  estimatedDuration: number; // En semaines
  rank: number;
  objectives?: LearningObjective[]; // Cascade V3
}

export interface LearningObjective {
  id: string;
  chapterId: string;
  label: string;
  rank: number;
}

export interface Teaching {
  id: string;
  subjectId: string;
  subjectName?: string;
  teacherId: string;
  teacherName?: string;
  coefficient: number;
  maxScore: number;
}

export interface SchoolClass {
  id: string;
  fullName: string; // Nom reconstruit (ex: "CM2 A")
  name: string;     // Suffixe (ex: "A")
  capacity: number;
  academicYearId: string;
  levelId: string;
  filiereId?: string | null;
  levelName?: string;
  filiereCode?: string | null;
}

export interface CreateClassRequest {
  academicYearId: string;
  levelId: string;
  filiereId?: string | null;
  name: string;
  capacity: number;
}

export interface CreateYearRequest {
  label: string;
  systemType: AcademicSystemType;
  adminStartDate: string;
  adminEndDate: string;
  lessonsStartDate: string;
  lessonsEndDate: string;
}
