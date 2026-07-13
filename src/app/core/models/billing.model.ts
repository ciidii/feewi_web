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
}

export interface RecordPaymentRequest {
  feeTypeCode: string;
  amount: number;
  method: PaymentMethod;
  reference?: string | null;
  receivedAt?: string | null;
  notes?: string | null;
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
