export interface School {
  id?: string;
  tenantId: string;
  name: string;
  slogan?: string;
  logoUrl?: string;
  phone: string;
  email: string;
  streetAddress: string;
  city: string;
  adminEmail: string;
  adminFirstName: string;
  adminLastName: string;
  adminPassword?: string;
  educationTemplate?: string; // ex: SN_FR, GMB_EN
  allowedCycles?: string[];   // ex: ["PRIMARY", "MIDDLE"]
  status?: 'TRIAL' | 'ACTIVE' | 'SUSPENDED';
  active?: boolean;
  createdAt?: string;
}

export interface PublicSchoolResponse {
  tenantId: string;
  name: string;
  slogan?: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  streetAddress?: string;
  city?: string;
  country?: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
