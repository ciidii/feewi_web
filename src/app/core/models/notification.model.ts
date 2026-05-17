export type NotificationChannel = 'EMAIL' | 'SMS' | 'IN_APP';

export type NotificationType = 
  | 'ADMISSION_SUBMITTED'
  | 'ADMISSION_VALIDATED' 
  | 'PAYMENT_RECEIVED' 

  | 'PAYMENT_REQUESTED'
  | 'CLASS_ASSIGNED'
  | 'GENERAL_INFO'
  | 'URGENT_ALERT';

export interface NotificationResponse {
  id: string;
  channel: NotificationChannel;
  type: NotificationType;
  subject: string;
  content: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'READ';
  link?: string;
  createdAt: string;
  sentAt?: string;
  readAt?: string | null;
}

export interface NotificationMetadata {
  icon: any; // Lucide icon
  colorClass: string; // CSS class for color (e.g., 'text-emerald-500')
  bgClass: string; // CSS class for background (e.g., 'bg-emerald-50')
}
