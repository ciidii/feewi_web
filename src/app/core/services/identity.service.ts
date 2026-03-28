import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';
import { User, UserCreateRequest, UserType } from '../models/user.model';
import { Role, Permission } from '../models/role.model';
import { Page } from '../models/school.model';
import { AuditLog } from '../models/audit.model';
import { EnvironmentService } from './environment.service';
import { NotificationService } from '../../shared/services/notification.service';

@Injectable({
  providedIn: 'root',
})
export class IdentityService {
  private http = inject(HttpClient);
  private envService = inject(EnvironmentService);
  private notificationService = inject(NotificationService);

  private readonly API_URL = this.envService.getServiceUrl('identity');

  // State
  private _staffPage = signal<Page<User> | null>(null);
  readonly staffPage = this._staffPage.asReadonly();

  private _roles = signal<Role[]>([]);
  readonly roles = this._roles.asReadonly();

  private _loading = signal<boolean>(false);
  readonly loading = this._loading.asReadonly();

  private handleError(message: string) {
    return (error: any) => {
      console.error(error);
      this.notificationService.error(message);
      return throwError(() => error);
    };
  }

  /**
   * Liste les membres du personnel (Staff)
   */
  getStaff(search: string = '', page: number = 0, size: number = 10, type?: string): Observable<Page<User>> {
    this._loading.set(true);
    let params = new HttpParams()
      .set('search', search)
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (type) params = params.set('type', type);

    return this.http.get<Page<User>>(`${this.API_URL}/users`, { params }).pipe(
      tap(response => this._staffPage.set(response)),
      catchError(this.handleError('Erreur lors de la récupération des utilisateurs')),
      finalize(() => this._loading.set(false))
    );
  }

  /**
   * Récupère le référentiel des types d'utilisateurs
   */
  getUserTypes(): Observable<UserType[]> {
    return this.http.get<UserType[]>(`${this.API_URL}/user-types`).pipe(
      catchError(this.handleError('Impossible de charger les types d\'utilisateurs'))
    );
  }

  /**
   * Récupère le profil complet d'un utilisateur (Vue Administrative)
   */
  getUserProfile(id: string): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/users/${id}/profile`).pipe(
      catchError(this.handleError('Impossible de charger le profil utilisateur'))
    );
  }

  /**
   * Crée un nouvel employé
   */
  createStaff(request: UserCreateRequest): Observable<User> {
    this._loading.set(true);
    return this.http.post<User>(`${this.API_URL}/users`, request).pipe(
      catchError(this.handleError('Erreur lors de la création de l\'utilisateur')),
      finalize(() => this._loading.set(false))
    );
  }

  /**
   * Liste les rôles disponibles
   */
  getRoles(): Observable<Role[]> {
    this._loading.set(true);
    return this.http.get<Role[]>(`${this.API_URL}/roles`).pipe(
      tap(roles => this._roles.set(roles)),
      catchError(this.handleError('Erreur lors du chargement des rôles')),
      finalize(() => this._loading.set(false))
    );
  }

  /**
   * Liste toutes les permissions disponibles
   */
  getAvailablePermissions(): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${this.API_URL}/permissions`).pipe(
      catchError(this.handleError('Impossible de charger les permissions'))
    );
  }

  /**
   * Récupère les logs d'audit
   */
  getTenantAuditLogs(page: number = 0, size: number = 20): Observable<Page<AuditLog>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<Page<AuditLog>>(`${this.API_URL}/audit/tenant`, { params }).pipe(
      catchError(this.handleError('Erreur lors du chargement des journaux d\'audit'))
    );
  }

  /**
   * Crée un rôle personnalisé
   */
  createRole(role: Role): Observable<Role> {
    this._loading.set(true);
    return this.http.post<Role>(`${this.API_URL}/roles`, role).pipe(
      catchError(this.handleError('Erreur lors de la création du rôle')),
      finalize(() => this._loading.set(false))
    );
  }

  /**
   * Met à jour un rôle existant
   */
  updateRole(id: string, role: Partial<Role>): Observable<Role> {
    this._loading.set(true);
    return this.http.put<Role>(`${this.API_URL}/roles/${id}`, role).pipe(
      catchError(this.handleError('Erreur lors de la mise à jour du rôle')),
      finalize(() => this._loading.set(false))
    );
  }
}
