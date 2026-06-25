export interface DashboardMetrics {
  totalApplications: number;
  newApplications: number;
  reEnrollments: number;
  conversionRate: number;
  growthTrend?: number;
}

export interface OperationalStats {
  pendingVerification: number;
  pendingEvaluation: number;
  pendingDecision: number;
  incompleteDossiers: number;
}

export interface PipelineStats {
  submitted: number;
  verified: number;
  testing: number;
  validated: number;
}

export interface LevelCapacityStat {
  id: string;
  name: string;
  totalApplications: number;
  validated: number;
  totalCapacity: number;
  occupancyRate: number;
  isSaturated: boolean;
}

export interface CapacityStats {
  saturatedLevelsCount: number;
  levels: LevelCapacityStat[];
}

export interface UpcomingMilestone {
  label: string;
  date: string;
  location?: string;
}

export interface EnrollmentDashboardStats {
  metrics: DashboardMetrics;
  operational: OperationalStats;
  pipeline: PipelineStats;
  capacity: CapacityStats;
  upcomingMilestones: UpcomingMilestone[];
}
