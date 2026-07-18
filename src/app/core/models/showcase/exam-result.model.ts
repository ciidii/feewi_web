export interface TopStudent {
  name: string;
  mention: string;
  score: string;
}

export interface ExamResult {
  id: string;
  examLabel: string;
  year: string;
  series?: string;
  totalCandidates: number;
  admittedCount: number;
  successRate: number;
  topStudents?: TopStudent[];
}
