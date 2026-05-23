import {computed, inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {catchError, map, Observable, of, switchMap, tap} from 'rxjs';
import {TenantContextService} from './tenant-context.service';
import {SchoolService} from './school.service';
import {NavigationContextService} from './navigation-context.service';
import {EnvironmentService} from './environment.service';
import {Staff} from '../models/user.model';

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
  staff?: Staff;
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
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  private readonly TOKEN_KEY = 'access_token';

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY) ?? sessionStorage.getItem(this.TOKEN_KEY);
  }

  private storeToken(token: string, rememberMe: boolean): void {
    // On commence par tout nettoyer pour éviter les conflits entre localStorage et sessionStorage
    this.clearToken();

    if (rememberMe) {
      localStorage.setItem(this.TOKEN_KEY, token);
    } else {
      sessionStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  private clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.TOKEN_KEY);
  }

  login(email: string, password: string, rememberMe = false): Observable<boolean> {
    console.log(`[AuthService] Attempting login for: ${email}`);
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, {email, password}).pipe(
      tap(response => {
        console.log('[AuthService] Login successful, storing token...');
        this.storeToken(response.access_token, rememberMe);
      }),
      switchMap(() => {
        console.log('[AuthService] Token stored, now fetching profile...');
        return this.fetchProfile();
      }),
      map(profile => {
        const success = !!profile;
        console.log(`[AuthService] Login process completed. Success: ${success}`);
        return success;
      }),
      catchError(error => {
        console.error('[AuthService] Login failed at some stage:', error);
        return of(false);
      })
    );
  }

  forgotPassword(email: string): Observable<void> {
    const payload: ForgotPasswordRequest = {email};
    return this.http.post<void>(`${this.API_URL}/auth/forgot-password`, payload);
  }

  resetPassword(payload: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/auth/reset-password`, payload);
  }

  impersonate(userId: string): Observable<boolean> {
    console.log('[AuthService] Attempting impersonation for:', userId);
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/impersonate/${userId}`, {}).pipe(
      tap(response => this.storeToken(response.access_token, true)),
      switchMap(() => this.fetchProfile()),
      map(profile => {
        if (profile) {
          this.router.navigate(['/admin/dashboard']);
          return true;
        }
        return false;
      }),
      catchError(error => {
        console.error('[AuthService] Impersonation failed', error);
        return of(false);
      })
    );
  }

  fetchProfile(): Observable<UserProfile | null> {
    const token = this.getToken();
    console.log('[AuthService] Fetching profile. Token present:', !!token);
    
    return this.http.get<UserProfile>(`${this.API_URL}/users/me`).pipe(
      tap(profile => {
        console.log('[AuthService] Profile fetched successfully for:', profile.email);
        this._currentUser.set(profile);
        this.updateTenantContext(profile);

        // Interception du changement de mot de passe forcé
        if (profile.forceChangePassword) {
            console.warn('[AuthService] Force password change required.');
            this.router.navigate(['/auth/force-password-change']);
        }
      }),
      catchError(error => {
        console.error('[AuthService] Error fetching profile:', error);
        this._currentUser.set(null);
        return of(null);
      })
    );
  }

  private updateTenantContext(profile: UserProfile): void {
    if (profile.tenantId && !this.navContext.isSaasDomain()) {
      this.schoolService.getPublicSchoolInfo(profile.tenantId).subscribe({
        next: (school) => {
          this.tenantService.setTenant({
            id: school.tenantId,
            name: school.name,
            logoUrl: school.logoUrl,
            allowedCycles: profile.allowedCycles
          });
        },
        error: () => {
          console.warn('[AuthService] Could not fetch school details, using fallback');
          this.tenantService.setTenant({
            id: profile.tenantId,
            name: 'Mon Établissement',
            allowedCycles: profile.allowedCycles
          });
        }
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
    this.clearToken();
    this.router.navigate(['/auth/login']);
  }

  hasPermission(permission: string): boolean {
    const user = this._currentUser();
    return user ? user.permissions.includes(permission) : false;
  }

  hasAnyPermission(permissions: string[]): boolean {
    const user = this._currentUser();
    if (!user) return false;
    return permissions.some(p => user.permissions.includes(p));
  }

  hasAllPermissions(permissions: string[]): boolean {
    const user = this._currentUser();
    if (!user) return false;
    return permissions.every(p => user.permissions.includes(p));
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
    const token = this.getToken();
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
        this.clearToken();
        this._currentUser.set(null);
        this._isReady.set(true);
        return of(false);
      })
    );
  }
}
