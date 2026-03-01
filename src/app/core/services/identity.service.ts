import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { User, UserCreateRequest } from '../models/user.model';
import { Role } from '../models/role.model';
import { Page } from '../models/school.model';

@Injectable({
  providedIn: 'root',
})
export class IdentityService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8080/api/v1';

  // State
  private _staffPage = signal<Page<User> | null>(null);
  readonly staffPage = this._staffPage.asReadonly();

  private _roles = signal<Role[]>([]);
  readonly roles = this._roles.asReadonly();

  private _loading = signal<boolean>(false);
  readonly loading = this._loading.asReadonly();

  /**
   * Liste les membres du personnel (Staff)
   */
  async getStaff(search: string = '', page: number = 0, size: number = 10): Promise<void> {
    this._loading.set(true);
    try {
      const params = new HttpParams()
        .set('search', search)
        .set('page', page.toString())
        .set('size', size.toString());

      const response = await firstValueFrom(
        this.http.get<Page<User>>(`${this.API_URL}/users`, { params })
      );
      this._staffPage.set(response);
    } catch (error) {
      console.error('Failed to fetch staff directory', error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Crée un nouvel employé
   */
  async createStaff(request: UserCreateRequest): Promise<User> {
    this._loading.set(true);
    try {
      return await firstValueFrom(
        this.http.post<User>(`${this.API_URL}/users`, request)
      );
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Liste les rôles disponibles (Système + Tenant)
   */
  async getRoles(): Promise<void> {
    this._loading.set(true);
    try {
      const roles = await firstValueFrom(
        this.http.get<Role[]>(`${this.API_URL}/roles`)
      );
      this._roles.set(roles);
    } catch (error) {
      console.error('Failed to fetch roles', error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Crée un rôle personnalisé
   */
  async createRole(role: Role): Promise<Role> {
    this._loading.set(true);
    try {
      return await firstValueFrom(
        this.http.post<Role>(`${this.API_URL}/roles`, role)
      );
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Met à jour un rôle existant (permissions, description)
   */
  async updateRole(id: string, role: Partial<Role>): Promise<Role> {
    this._loading.set(true);
    try {
      return await firstValueFrom(
        this.http.put<Role>(`${this.API_URL}/roles/${id}`, role)
      );
    } finally {
      this._loading.set(false);
    }
  }
}
