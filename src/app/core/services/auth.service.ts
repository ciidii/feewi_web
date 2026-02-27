import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom, tap } from 'rxjs';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string;
  active: boolean;
  roles: string[];
  permissions: string[];
}

interface LoginResponse {
  access_token: string;
  token_type: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly API_URL = 'http://localhost:8080/api/v1';

  // State
  private _currentUser = signal<UserProfile | null>(null);
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  constructor() {
    this.checkSession();
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, { email, password })
      );

      localStorage.setItem('access_token', response.access_token);
      await this.fetchProfile();
      return true;
    } catch (error) {
      console.error('Login failed', error);
      return false;
    }
  }

  async fetchProfile(): Promise<void> {
    try {
      const profile = await firstValueFrom(
        this.http.get<UserProfile>(`${this.API_URL}/users/me`)
      );
      this._currentUser.set(profile);
    } catch (error) {
      this.logout();
    }
  }

  logout(): void {
    this._currentUser.set(null);
    localStorage.removeItem('access_token');
    this.router.navigate(['/auth/login']);
  }

  hasPermission(permission: string): boolean {
    const user = this._currentUser();
    return user ? user.permissions.includes(permission) : false;
  }

  private async checkSession(): Promise<void> {
    const token = localStorage.getItem('access_token');
    if (token) {
      await this.fetchProfile();
    }
  }
}
