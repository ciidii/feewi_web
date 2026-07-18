export interface PricingPlan {
  id: string;
  cycle: string;
  label: string;
  tuitionAmount: number;
  currency: string;
  period: string;
  registrationFee?: number;
  inclusions: string[];
}

export interface CampusAmenity {
  id: string;
  icon: string;
  label: string;
  description: string;
  included: boolean;
}
