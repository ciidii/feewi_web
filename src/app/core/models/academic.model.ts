export type YearStatus = 'PLANNING' | 'ACTIVE' | 'CLOSING' | 'ARCHIVED';
export type AcademicSystemType = 'TRIMESTER' | 'SEMESTER' | 'ANNUAL';

export interface AcademicYear {
  id: string;
  label: string;
  status: YearStatus;
  systemType: AcademicSystemType;
  startDate: string;
  endDate: string;
  createdAt?: string;
}

export type MilestoneType = 'ENROLLMENT' | 'LESSONS' | 'EXAMS' | 'RE_ENROLLMENT' | 'VACATION';

export interface AcademicMilestone {
  id: string;
  yearId: string;
  type: MilestoneType;
  label: string;
  startDate: string;
  endDate: string;
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
  cycleCode?: string;   // Gardé pour compatibilité
  systemName?: string;  // Gardé pour compatibilité
  name?: string;        // Nouveau (JSON)
  code?: string;        // Nouveau (JSON)
  customName?: string;
  active?: boolean;
  rank: number;
}

export interface Level {
  id: string;
  name: string;
  rank: number;
  cycleId?: string;
  cycle?: Cycle;
}

/**
 * Structure groupée Cycle -> Niveaux (Nouvel End-point)
 */
export interface CycleGroup {
  cycle: Cycle;
  levels: Level[];
}

export interface Filiere {
  id: string;
  name: string;
  code: string;
  active: boolean;
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
  
  // Statistiques V4 (Calculées par le backend ou enrichies en front)
  totalTeachings?: number;    // Nombre total de matières prévues
  assignedTeachings?: number; // Nombre de matières avec un prof assigné
  currentOccupancy?: number;  // Nombre d'élèves déjà affectés (API)
  occupancyRate?: number;     // Taux d'occupation en % (API)
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
  startDate: string;
  endDate: string;
}

// ===========================================
// AFFECTATION DES ÉLÈVES (STUDENT ASSIGNMENT)
// ===========================================

export type AssignmentStatus = 'WAITING' | 'ASSIGNED';

export interface StudentAssignment {
  id: string;
  studentId: string;
  registrationNumber?: string; // Matricule (Dénormalisé)
  studentFirstName?: string;
  studentLastName?: string;
  studentGender?: 'MALE' | 'FEMALE';
  birthDate?: string; // Date de naissance (Dénormalisée)
  academicYearId: string;
  levelId: string;
  status: AssignmentStatus;
  schoolClassId: string | null;
  assignedAt?: string;

  // Autres champs enrichis optionnels
  levelName?: string;
  classFullName?: string;
}

export interface AssignmentSummary {
  levelId: string;
  levelName: string | null;
  assigned: number;
  waiting: number;
  totalCapacity: number;
  remainingCapacity: number;
}
