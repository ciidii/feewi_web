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
