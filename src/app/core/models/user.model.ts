export interface User {
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId?: string;
  active?: boolean;
  roles: string[];
  permissions?: string[];
  phone?: string;
  password?: string;
  createdAt?: string;
}

export interface UserCreateRequest {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles: string[];
}
