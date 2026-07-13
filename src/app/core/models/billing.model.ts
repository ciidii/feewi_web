// Miroir de docs/api/billing-service-api.yaml (billing-service, port 8087).
// Périmètre v1 (ADR-002) : pas de facture formelle, solde toujours calculé,
// jamais persisté côté backend.

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'WAVE' | 'ORANGE_MONEY';

export interface FeeType {
  id: string;
  code: string;
  label: string;
  active: boolean;
  isSystemDefined: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeeTypeRequest {
  code: string;
  label: string;
}

export interface UpdateFeeTypeRequest {
  label?: string;
  active?: boolean;
}

export interface FeeItem {
  id: string;
  studentId: string;
  feeTypeCode: string;
  academicYearId: string;
  label: string;
  amount: number;
  dueDate?: string | null;
  createdBy: string;
  createdAt: string;
  /** Renseignés uniquement pour les tranches d'un plan d'installments (BL-BILL-06, ADR-007). */
  installmentGroupId?: string | null;
  installmentSequence?: number | null;
}

export interface CreateFeeItemRequest {
  feeTypeCode: string;
  academicYearId: string;
  label: string;
  amount: number;
  dueDate?: string | null;
}

export interface Payment {
  id: string;
  studentId: string;
  feeTypeCode: string;
  amount: number;
  method: PaymentMethod;
  reference?: string | null;
  receivedAt: string;
  recordedBy: string;
  recordedAt: string;
  notes?: string | null;
  receiptNumber?: string | null;
  /** Non-null si ce paiement solde spécifiquement une tranche (BL-BILL-06, ADR-007 §6). */
  feeItemId?: string | null;
}

export interface RecordPaymentRequest {
  feeTypeCode: string;
  amount: number;
  method: PaymentMethod;
  reference?: string | null;
  receivedAt?: string | null;
  notes?: string | null;
  /** Si fourni, ce paiement solde spécifiquement cette tranche (BL-BILL-06, ADR-007 §6). */
  feeItemId?: string | null;
}

export interface FeeTypeBalance {
  feeTypeCode: string;
  label: string;
  due: number;
  paid: number;
  balance: number;
}

export interface StudentStatement {
  studentId: string;
  totalDue: number;
  totalPaid: number;
  balance: number;
  byFeeType: FeeTypeBalance[];
  payments: Payment[];
}

/** Solde d'un élève sans historique de paiements — retourné par le batch BL-BILL-02. */
export interface StudentBalance {
  studentId: string;
  totalDue: number;
  totalPaid: number;
  balance: number;
  byFeeType: FeeTypeBalance[];
}

// --- REPORTING AGRÉGÉ (BL-BILL-04, ADR-005) ---

/** Groupe nommé de studentId envoyé au reporting agrégé — billing-service n'interprète jamais groupKey. */
export interface AggregateGroupRequest {
  groupKey: string;
  studentIds: string[];
}

export interface AggregateRequest {
  groups: AggregateGroupRequest[];
}

export interface AggregateGroupTotals {
  groupKey?: string;
  studentCount: number;
  totalDue: number;
  totalPaid: number;
  totalBalance: number;
  /** null si totalDue = 0 — pas de taux de recouvrement significatif, distinct de 0%. */
  recoveryRate: number | null;
}

export interface AggregateReportResponse {
  groups: AggregateGroupTotals[];
  overall: AggregateGroupTotals;
}

// --- TRANCHES DE PAIEMENT (BL-BILL-06, ADR-007) ---

export type InstallmentStatus = 'PENDING' | 'PAID' | 'OVERDUE';

export interface CreateInstallmentPlanRequest {
  feeTypeCode: string;
  academicYearId: string;
  totalAmount: number;
  installmentCount: number;
  /** Date ISO (yyyy-MM-dd), échéance de la 1re tranche. */
  firstDueDate: string;
  intervalDays: number;
}

export interface InstallmentTranche {
  feeItemId: string;
  installmentSequence: number;
  amount: number;
  dueDate: string;
  remainingAmount: number;
  status: InstallmentStatus;
  daysOverdue: number;
}

export interface InstallmentPlan {
  installmentGroupId: string;
  feeTypeCode: string;
  tranches: InstallmentTranche[];
}

/** Ligne de la liste de retard tenant entier — envoi manuel par le Secrétariat (Approche B, pas de SMS auto). */
export interface OverdueInstallment {
  studentId: string;
  feeItemId: string;
  installmentSequence: number;
  remainingAmount: number;
  dueDate: string;
  daysOverdue: number;
  guardianEmail?: string | null;
  guardianPhone?: string | null;
  /** Limitation connue : GuardianLink ne capture pas de nom de tuteur — c'est le nom de l'élève. */
  guardianName?: string | null;
}

/** Erreur billing-service — errorCode stable pour les 422 documentés (ADR-002 §5). */
export interface BillingErrorCode {
  FEE_TYPE_SYSTEM_DEFINED: 'FEE_TYPE_SYSTEM_DEFINED';
  FEE_TYPE_IN_USE: 'FEE_TYPE_IN_USE';
  FEE_TYPE_CODE_DUPLICATE: 'FEE_TYPE_CODE_DUPLICATE';
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Espèces',
  BANK_TRANSFER: 'Virement bancaire',
  WAVE: 'Wave',
  ORANGE_MONEY: 'Orange Money',
};
