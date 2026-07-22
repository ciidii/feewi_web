/**
 * Modèles de la facturation SaaS (Feewi → écoles).
 * Miroir des DTOs de l'identity-service (subscription).
 */

export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELLED';
export type SubscriptionPlan = 'MONTHLY' | 'ANNUAL';
export type PaymentMethod = 'ESPECES' | 'VIREMENT' | 'MOBILE_MONEY' | 'CHEQUE' | 'AUTRE';

export interface Subscription {
  id: string;
  schoolId: string;
  plan: SubscriptionPlan;
  amount: number;
  currency: string;
  status: SubscriptionStatus;
  graceDays: number;
  trialEndsAt?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  lastPaymentAt?: string;
}

export interface RecordPaymentRequest {
  amount?: number;
  method: string;
}

export interface SubscriptionPayment {
  id: string;
  subscriptionId: string;
  schoolId: string;
  cycleId?: string;
  amount: number;
  method: string;
  receiptNumber: string;
  paidAt: string;
}

export interface BillingOverview {
  mrr: number;
  currency: string;
  total: number;
  trial: number;
  active: number;
  pastDue: number;
  suspended: number;
  cancelled: number;
}

export interface RelanceItem {
  schoolId: string;
  schoolName?: string;
  status: SubscriptionStatus;
  amount: number;
  currency: string;
  since?: string;
  graceDays: number;
}
