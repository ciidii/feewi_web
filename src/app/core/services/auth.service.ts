import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom, tap } from 'rxjs';
import { TenantContextService } from './tenant-context.service';
import { SchoolService } from './school.service';
import { NavigationContextService } from './navigation-context.service';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string;
  active: boolean;
  roles: string[];
  permissions: string[];
  allowedCycles: string[];
  educationTemplate: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
}

interface ForgotPasswordRequest {
  email: string;
}

interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private tenantService = inject(TenantContextService);
  private schoolService = inject(SchoolService);
  private navContext = inject(NavigationContextService);
  private readonly API_URL = 'http://localhost:8080/api/v1';

  // State
  private _currentUser = signal<UserProfile | null>(null);
  private _isReady = signal<boolean>(false);

  readonly currentUser = this._currentUser.asReadonly();
  readonly isReady = this._isReady.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  constructor() {}

  async login(email: string, password: string): Promise<boolean> {
    console.log('[AuthService] Attempting login for:', email);
    try {
      const response = await firstValueFrom(
        this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, { email, password })
      );

      localStorage.setItem('access_token', response.access_token);
      await this.fetchProfile();
      return true;
    } catch (error) {
      console.error('[AuthService] Login failed', error);
      return false;
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const payload: ForgotPasswordRequest = { email };
    await firstValueFrom(this.http.post<void>(`${this.API_URL}/auth/forgot-password`, payload));
  }

  async resetPassword(payload: ResetPasswordRequest): Promise<void> {
    await firstValueFrom(this.http.post<void>(`${this.API_URL}/auth/reset-password`, payload));
  }

  async impersonate(userId: string): Promise<boolean> {
    console.log('[AuthService] Attempting impersonation for:', userId);
    try {
      const response = await firstValueFrom(
        this.http.post<LoginResponse>(`${this.API_URL}/auth/impersonate/${userId}`, {})
      );

      localStorage.setItem('access_token', response.access_token);
      await this.fetchProfile();
      this.router.navigate(['/school-app/dashboard']);
      return true;
    } catch (error) {
      console.error('[AuthService] Impersonation failed', error);
      return false;
    }
  }

  async fetchProfile(): Promise<void> {
    console.log('[AuthService] Fetching profile...');
    try {
      const profile = await firstValueFrom(
        this.http.get<UserProfile>(`${this.API_URL}/users/me`)
      );
      console.log('[AuthService] Profile fetched successfully:', profile.email);
      this._currentUser.set(profile);

      // Update Tenant Context dynamiquement
      if (profile.tenantId && !this.navContext.isSaasDomain()) {
        try {
          // On tente de récupérer le nom réel de l'école
          const school = await this.schoolService.getSchoolById(profile.tenantId);
          this.tenantService.setTenant({
            id: school.tenantId,
            name: school.name,
            allowedCycles: profile.allowedCycles
          });
        } catch (e) {
          console.warn('[AuthService] Could not fetch school details, using fallback');
          this.tenantService.setTenant({
            id: profile.tenantId,
            name: 'Mon Établissement',
            allowedCycles: profile.allowedCycles
          });
        }
      } else if (this.navContext.isSaasDomain()) {
        this.tenantService.setTenant({
          id: 'SYSTEM',
          name: 'Administration Feewi',
          allowedCycles: []
        });
      }
    } catch (error) {
      console.warn('[AuthService] Failed to fetch profile (User might not be logged in)');
      this._currentUser.set(null);
    }
  }

  logout(): void {
    console.log('[AuthService] Logging out...');
    this._currentUser.set(null);
    localStorage.removeItem('access_token');
    this.router.navigate(['/auth/login']);
  }

  hasPermission(permission: string): boolean {
    const user = this._currentUser();
    return user ? user.permissions.includes(permission) : false;
  }

  hasRole(role: string): boolean {
    const user = this._currentUser();
    return user ? user.roles.includes(role) : false;
  }

  isCycleAllowed(cycleCode: string): boolean {
    const user = this._currentUser();
    if (!user || !user.allowedCycles) return false;
    return user.allowedCycles.some(code => code.toUpperCase() === cycleCode.toUpperCase());
  }

  async checkSession(): Promise<void> {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        // On essaie de récupérer le profil, mais on ne bloque pas indéfiniment
        await Promise.race([
          this.fetchProfile(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
        ]);
      } catch (e) {
        console.warn('Session check failed or timed out. User will need to login.', e);
        localStorage.removeItem('access_token');
        this._currentUser.set(null);
      }
    }
    this._isReady.set(true);
    return Promise.resolve(); // On résout explicitement pour Angular
  }
}
