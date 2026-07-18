export interface SchoolStat {
  label: string;
  value: string;
}

export interface SchoolSocialLinks {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  whatsapp?: string;
}

/** Champs de branding vitrine partagés entre l'admin (School) et le public (PublicSchoolResponse). */
export interface SchoolBrandingFields {
  coverUrl?: string;
  description?: string;
  secondaryColor?: string;
  accentColor?: string;
  foundedYear?: number;
  studentCount?: number;
  values?: string[];
  stats?: SchoolStat[];
  socialLinks?: SchoolSocialLinks;
}

export interface School extends SchoolBrandingFields {
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
  adminStaffType?: 'ADMINISTRATION' | 'TEACHER' | 'SUPPORT' | 'OTHER';
  educationTemplate?: string; // ex: SN_FR, GMB_EN
  allowedCycles?: string[];   // ex: ["PRIMARY", "MIDDLE"]
  status?: 'TRIAL' | 'ACTIVE' | 'SUSPENDED';
  active?: boolean;
  createdAt?: string;
}

export interface PublicSchoolResponse extends SchoolBrandingFields {
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
