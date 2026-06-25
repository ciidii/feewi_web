export interface AuditLog {
  timestamp: string;
  actorEmail: string;
  action: string;
  targetId?: string;
  description: string;
}

export type AuditAction = 
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_ACCOUNT_DISABLED'
  | 'ROLE_CREATED'
  | 'ROLE_UPDATED'
  | 'SCHOOL_CREATED'
  | 'PERMISSION_CREATED';
