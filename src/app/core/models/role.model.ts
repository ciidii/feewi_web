export interface Role {
  id?: string;
  name: string;
  description?: string;
  permissions: string[];
  tenantId?: string;
  memberCount?: number;
  isSystem?: boolean;
}

export interface Permission {
  code: string;
  description: string;
  module: string;
}
