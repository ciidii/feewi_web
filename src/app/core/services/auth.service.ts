import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { TenantContextService } from './tenant-context.service';
import { SchoolService } from './school.service';
import { NavigationContextService } from './navigation-context.service';
import { EnvironmentService } from './environment.service';

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
  private envService = inject(EnvironmentService);
  private readonly API_URL = this.envService.getServiceUrl('identity');

  // State
  private _currentUser = signal<UserProfile | null>(null);
  private _isReady = signal<boolean>(false);

  readonly currentUser = this._currentUser.asReadonly();
  readonly isReady = this._isReady.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  constructor() {}

  login(email: string, password: string): Observable<boolean> {
    console.log('[AuthService] Attempting login for:', email);
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, { email, password }).pipe(
      tap(response => localStorage.setItem('access_token', response.access_token)),
      map(() => {
        // Déclenche la récupération du profil en arrière-plan (réactif)
        this.fetchProfile().subscribe();
        return true;
      }),
      catchError(error => {
        console.error('[AuthService] Login failed', error);
        return of(false);
      })
    );
  }

  forgotPassword(email: string): Observable<void> {
    const payload: ForgotPasswordRequest = { email };
    return this.http.post<void>(`${this.API_URL}/auth/forgot-password`, payload);
  }

  resetPassword(payload: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/auth/reset-password`, payload);
  }

  impersonate(userId: string): Observable<boolean> {
    console.log('[AuthService] Attempting impersonation for:', userId);
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/impersonate/${userId}`, {}).pipe(
      tap(response => localStorage.setItem('access_token', response.access_token)),
      map(() => {
        this.fetchProfile().subscribe();
        this.router.navigate(['/school-app/dashboard']);
        return true;
      }),
      catchError(error => {
        console.error('[AuthService] Impersonation failed', error);
        return of(false);
      })
    );
  }

  fetchProfile(): Observable<UserProfile | null> {
    console.log('[AuthService] Fetching profile...');
    return this.http.get<UserProfile>(`${this.API_URL}/users/me`).pipe(
      tap(profile => {
        console.log('[AuthService] Profile fetched successfully:', profile.email);
        this._currentUser.set(profile);
        this.updateTenantContext(profile);
      }),
      catchError(error => {
        console.warn('[AuthService] Failed to fetch profile (User might not be logged in)');
        this._currentUser.set(null);
        return of(null);
      })
    );
  }

  private updateTenantContext(profile: UserProfile): void {
    if (profile.tenantId && !this.navContext.isSaasDomain()) {
      // Version Promise-to-Observable élégante
      this.schoolService.getSchoolById(profile.tenantId).then(school => {
        this.tenantService.setTenant({
          id: school.tenantId,
          name: school.name,
          allowedCycles: profile.allowedCycles
        });
      }).catch(() => {
        console.warn('[AuthService] Could not fetch school details, using fallback');
        this.tenantService.setTenant({
          id: profile.tenantId,
          name: 'Mon Établissement',
          allowedCycles: profile.allowedCycles
        });
      });
    } else if (this.navContext.isSaasDomain()) {
      this.tenantService.setTenant({
        id: 'SYSTEM',
        name: 'Administration Feewi',
        allowedCycles: []
      });
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

  checkSession(): Observable<boolean> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      this._isReady.set(true);
      return of(false);
    }

    return this.fetchProfile().pipe(
      map(profile => {
        this._isReady.set(true);
        return profile !== null;
      }),
      catchError(() => {
        localStorage.removeItem('access_token');
        this._currentUser.set(null);
        this._isReady.set(true);
        return of(false);
      })
    );
  }
}
