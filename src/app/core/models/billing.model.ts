// Miroir de docs/api/billing-service-api.yaml (billing-service, port 8087).
// Périmètre v1 (ADR-002) : pas de facture formelle, solde toujours calculé,
// jamais persisté côté backend.

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'WAVE' | 'ORANGE_MONEY';

/**
 * Forme du prix d'un FeeType (ADR-012 §1). Déclaré explicitement — la facturation n'est plus déduite.
 * - PER_LEVEL : grille par niveau, chaque option a `code = levelId` (scolarité, inscription, réinscription).
 * - PER_OPTION : catalogue d'options, `code` = code métier stable (formule cantine, zone transport).
 * - FLAT : montant unique porté par `defaultAmount`.
 */
export type PriceShape = 'PER_LEVEL' | 'PER_OPTION' | 'FLAT';

/**
 * Rythme de facturation d'un FeeType (ADR-012 §1).
 * - SPREAD_ANNUAL : étalé sur les mensualités (scolarité, service mensualisé).
 * - ONE_OFF : facturé une fois à l'admission (inscription/réinscription, forfait service).
 * - ON_DEMAND : saisie manuelle ponctuelle.
 */
export type BillingSchedule = 'SPREAD_ANNUAL' | 'ONE_OFF' | 'ON_DEMAND';

/**
 * Option tarifaire d'un FeeType (ADR-009 §1/§2). Deux modes de résolution du champ `code`,
 * non unifiés côté backend :
 * - Services parascolaires (TRANSPORT, CANTEEN...) : `code` = code métier texte stable
 *   (ex. "ALLER_RETOUR"), résolu depuis ServiceSubscription.optionCode.
 * - FeeType SCOLARITE uniquement : `code` = levelId (UUID academic-structure-service),
 *   résolu depuis wish.levelId.
 */
export interface FeeTypeOption {
  code: string;
  label: string;
  price: number;
}

export interface FeeType {
  id: string;
  code: string;
  label: string;
  active: boolean;
  isSystemDefined: boolean;
  createdAt: string;
  updatedAt: string;
  /**
   * Montant de référence utilisé par la facturation automatique des services parascolaires
   * (BL-BILL-10) — null pour INSCRIPTION/SCOLARITE et tout type destiné à des FeeItem ponctuels
   * saisis à la main. Sans ce montant, un service souscrit à l'inscription (Cantine, Transport)
   * ne sera jamais facturé automatiquement.
   * Coexiste avec `options` (ADR-009 §1) : si `options` est renseigné, il est prioritaire pour
   * la résolution de prix côté backend — `defaultAmount` reste un fallback pour la facturation
   * ponctuelle (BL-BILL-10) tant qu'aucune option n'est configurée.
   */
  defaultAmount?: number | null;
  /** Catalogue d'options tarifaires (ADR-009) — toujours présent, [] si aucune option configurée. */
  options: FeeTypeOption[];
  /** Forme du prix déclarée (ADR-012 §1) — pilote l'UI dédiée et la facturation. */
  priceShape: PriceShape;
  /** Rythme de facturation déclaré (ADR-012 §1). */
  billingSchedule: BillingSchedule;
}

export interface CreateFeeTypeRequest {
  code: string;
  label: string;
  /** Combinaison légale (ADR-012 §2) : préfixée par le modèle choisi côté UI. */
  priceShape: PriceShape;
  billingSchedule: BillingSchedule;
  defaultAmount?: number | null;
  options?: FeeTypeOption[];
}

export interface UpdateFeeTypeRequest {
  label?: string;
  active?: boolean;
  /** Le `priceShape` est verrouillé après création (comme le code) — jamais renvoyé ici. */
  billingSchedule?: BillingSchedule;
  defaultAmount?: number | null;
  options?: FeeTypeOption[];
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

/** Une composante d'une mensualité combinée (ADR-013) : la part d'un service dans le total du mois. */
export interface MonthlyBillingComponent {
  feeTypeCode: string;
  label: string;
  amount: number;
}

/** Une mensualité combinée au relevé (ADR-013) : total du mois + détail par service. */
export interface MonthlyBillingLine {
  /** Mois facturé, format `YYYY-MM`. */
  period: string;
  label: string;
  amount: number;
  composition: MonthlyBillingComponent[];
}

export interface StudentStatement {
  studentId: string;
  totalDue: number;
  totalPaid: number;
  balance: number;
  byFeeType: FeeTypeBalance[];
  payments: Payment[];
  /** ADR-013 : mensualités combinées (total + détail par service), triées par mois. */
  monthlyBreakdown?: MonthlyBillingLine[];
  /** ADR-013 : total annuel projeté (objectif de l'année) — null si l'élève n'a pas de plan. */
  annualTotal?: number | null;
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

// --- RÉGLAGES DE FACTURATION (ADR-009 §5) ---

export interface BillingSettings {
  nombreMensualites: number;
  updatedAt?: string | null;
  /** Email de l'utilisateur ayant modifié le réglage — null pour le seed système. */
  updatedBy?: string | null;
}

export interface UpdateBillingSettingsRequest {
  nombreMensualites: number;
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Espèces',
  BANK_TRANSFER: 'Virement bancaire',
  WAVE: 'Wave',
  ORANGE_MONEY: 'Orange Money',
};

/** Libellé court du rythme de facturation (ADR-012) — pour les badges du catalogue. */
export const BILLING_SCHEDULE_LABELS: Record<BillingSchedule, string> = {
  SPREAD_ANNUAL: 'Étalé sur l\'année',
  ONE_OFF: 'Ponctuel à l\'admission',
  ON_DEMAND: 'À la demande',
};

/** Libellé court de la forme de prix (ADR-012) — nature du frais. */
export const PRICE_SHAPE_LABELS: Record<PriceShape, string> = {
  PER_LEVEL: 'Tarifé par niveau',
  PER_OPTION: 'Tarifé par formule / zone',
  FLAT: 'Montant unique',
};
