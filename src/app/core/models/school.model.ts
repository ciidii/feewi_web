export interface School {
  id?: string;
  tenantId: string;
  name: string;
  slogan?: string;
  phone: string;
  email: string;
  streetAddress: string;
  city: string;
  adminEmail: string;
  adminFirstName: string;
  adminLastName: string;
  adminPassword?: string;
  active?: boolean;
  createdAt?: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
