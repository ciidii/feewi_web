export type NotificationChannel = 'EMAIL' | 'SMS' | 'IN_APP';

export type NotificationType =
  | 'ADMISSION_SUBMITTED'
  | 'ADMISSION_VALIDATED'
  | 'ADMISSION_WAITLISTED'
  | 'PAYMENT_RECEIVED'

  | 'PAYMENT_REQUESTED'
  | 'CLASS_ASSIGNED'
  | 'CLASS_UNASSIGNED'
  | 'GENERAL_INFO'
  | 'URGENT_ALERT';

export interface NotificationResponse {
  id: string;
  channel: NotificationChannel;
  type: NotificationType;
  subject: string;
  content: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'READ';
  targetId?: string; // ID de la ressource concernée
  createdAt: string;
  sentAt?: string;
  readAt?: string | null;
}

export interface NotificationMetadata {
  label: string; // Human readable label (e.g., 'Admission')
  icon: any; // Lucide icon
  colorClass: string; // CSS class for color (e.g., 'text-emerald-500')
  bgClass: string; // CSS class for background (e.g., 'bg-emerald-50')
  routePattern?: string; // Angular route pattern (e.g., '/admin/enrollment/admissions/:id')
}
