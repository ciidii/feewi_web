export interface UserType {
  id: string;
  code: string;
  name: string;
}

export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  staffType: 'TEACHER' | 'ADMINISTRATION' | 'SUPPORT' | 'OTHER';
  matricule?: string;
  createdAt?: string;
  hasUserAccount?: boolean;
}

export interface StaffCreateRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  staffType: string;
  matricule?: string;
}

export interface User {
  id?: string;
  email: string;
  firstName?: string; // Legacy or derived from staff
  lastName?: string;  // Legacy or derived from staff
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
  staff?: Staff; // New vision: user is linked to a staff member
}

export interface UserCreateRequest {
  email: string;
  password?: string;
  staffId: string; // Mandatory in new vision
  userTypeCode: string; // TEACHER, ADMIN, etc.
  roles: string[];
}
