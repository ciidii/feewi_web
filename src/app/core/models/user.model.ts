export interface UserType {
  id: string;
  code: string;
  name: string;
}

export interface User {
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  userType?: string;
  tenantId?: string;
  active?: boolean;
  roles: string[];
  permissions?: string[];
  phone?: string;
  password?: string;
  createdAt?: string;
  lastLoginAt?: string;
  connectionCount?: number;
  lastDeviceType?: string;
}

export interface UserCreateRequest {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  userTypeCode: string; // TEACHER, STAFF, etc.
  phone?: string;
  roles: string[];
}
