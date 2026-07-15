export interface Role {
  id?: string;
  name: string;
  description?: string;
  permissions: string[];
  tenantId?: string;
  memberCount?: number;
  isSystemRole?: boolean;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
}

export type RiskLevel = 'NORMAL' | 'SENSITIVE' | 'CRITICAL';

export interface PermissionCapability {
  code: string;
  label: string;
  categoryCode: string;
  categoryLabel: string;
  riskLevel: RiskLevel;
  permissions: string[];
}

export interface RolePreset {
  code: string;
  name: string;
  description: string;
  permissions: string[];
}
