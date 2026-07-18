import {inject, Injectable, signal} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {catchError, finalize, Observable, tap, throwError} from 'rxjs';
import {Page, PublicSchoolResponse, School} from '../models/school.model';
import {AuditLog} from '../models/audit.model';
import {BrandingUploadTicketRequest, BrandingUploadTicketResponse} from '../models/showcase';
import {EnvironmentService} from './environment.service';
import {NotificationService} from '../../shared/services/notification.service';

@Injectable({
  providedIn: 'root',
})
export class SchoolService {
  private http = inject(HttpClient);
  private envService = inject(EnvironmentService);
  private notificationService = inject(NotificationService);

  private readonly API_URL = this.envService.getServiceUrl('school');
  private readonly IDENTITY_API_URL = this.envService.getServiceUrl('identity');

  // État global pour les écoles (Signals)
  private _schoolsPage = signal<Page<School> | null>(null);
  readonly schoolsPage = this._schoolsPage.asReadonly();

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
   * ==========================================================================
   * 1. GESTION LOCALE (ADMIN ÉCOLE)
   * Utilise l'endpoint /my-school basé sur le tenantId du JWT.
   * ==========================================================================
   */

  /**
   * Récupère les informations de l'établissement actuel (Admin Local)
   */
  getMySchool(): Observable<School> {
    this._loading.set(true);
    return this.http.get<School>(`${this.API_URL}/my-school`).pipe(
      catchError(this.handleError('Impossible de charger les paramètres de votre établissement')),
      finalize(() => this._loading.set(false))
    );
  }

  /**
   * Met à jour les informations de son propre établissement (Admin Local)
   * Champs modifiables : name, slogan, phone, email, logoUrl, adresse...
   */
  updateMySchool(school: Partial<School>): Observable<School> {
    this._loading.set(true);
    return this.http.patch<School>(`${this.API_URL}/my-school`, school).pipe(
      tap(() => this.notificationService.success('Informations de l\'établissement mises à jour')),
      catchError(this.handleError('Erreur lors de la mise à jour')),
      finalize(() => this._loading.set(false))
    );
  }

  /**
   * ==========================================================================
   * 2. GESTION SAAS (SUPER ADMIN)
   * Utilise les endpoints /schools classiques avec ID.
   * ==========================================================================
   */

  /**
   * Liste toutes les écoles de la plateforme (Super Admin)
   */
  getSchools(search: string = '', page: number = 0, size: number = 10): Observable<Page<School>> {
    this._loading.set(true);
    const params = new HttpParams()
      .set('search', search)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<Page<School>>(this.API_URL, { params }).pipe(
      tap(response => this._schoolsPage.set(response)),
      catchError(this.handleError('Erreur lors du chargement des établissements')),
      finalize(() => this._loading.set(false))
    );
  }

  /**
   * Récupère les détails d'une école par son ID (UUID)
   */
  getSchoolById(id: string): Observable<School> {
    return this.http.get<School>(`${this.API_URL}/${id}`).pipe(
      catchError(this.handleError('Impossible de récupérer les détails de l\'établissement'))
    );
  }

  /**
   * Récupère les informations publiques d'un établissement par son tenantId (Slug)
   * Utilisé pour le branding (logo, nom) au login ou sur le portail public
   */
  getPublicSchoolInfo(tenantId: string): Observable<PublicSchoolResponse> {
    return this.http.get<PublicSchoolResponse>(`${this.API_URL}/public/${tenantId}`).pipe(
      catchError(this.handleError(`Impossible de charger les infos de l'établissement "${tenantId}"`))
    );
  }

  /**
   * Demande un ticket d'upload public et permanent pour le logo ou la couverture de l'école
   * (proxy vers document-engine-service, cf. SchoolController#requestBrandingUploadTicket).
   */
  getBrandingUploadTicket(request: BrandingUploadTicketRequest): Observable<BrandingUploadTicketResponse> {
    return this.http.post<BrandingUploadTicketResponse>(`${this.API_URL}/my-school/branding/upload-ticket`, request).pipe(
      catchError(this.handleError('Impossible d\'obtenir un ticket d\'envoi pour l\'image'))
    );
  }

  /**
   * Provisionne une nouvelle école (SaaS Admin)
   */
  createSchool(school: any): Observable<School> {
    this._loading.set(true);
    return this.http.post<School>(this.API_URL, school).pipe(
      catchError(this.handleError('Erreur lors de la création de l\'établissement')),
      finalize(() => this._loading.set(false))
    );
  }

  /**
   * Édite une école arbitraire (Super Admin).
   * Endpoint: PATCH /schools/{id}
   */
  updateSchool(id: string, school: Partial<School>): Observable<School> {
    this._loading.set(true);
    return this.http.patch<School>(`${this.API_URL}/${id}`, school).pipe(
      tap(() => this.notificationService.success('Établissement mis à jour')),
      catchError(this.handleError('Erreur lors de la mise à jour de l\'établissement')),
      finalize(() => this._loading.set(false))
    );
  }

  /**
   * Supprime une école et ses données d'identité (Super Admin).
   * Endpoint: DELETE /schools/{id}
   */
  deleteSchool(id: string): Observable<void> {
    this._loading.set(true);
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      tap(() => this.notificationService.success('Établissement supprimé')),
      catchError(this.handleError('Erreur lors de la suppression de l\'établissement')),
      finalize(() => this._loading.set(false))
    );
  }

  /**
   * Change le statut d'un établissement (Suspendre/Activer)
   * Endpoint: PATCH /schools/{id}/status
   */
  updateSchoolStatus(id: string, status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL'): Observable<void> {
    this._loading.set(true);
    return this.http.patch<void>(`${this.API_URL}/${id}/status`, { status }).pipe(
      tap(() => this.notificationService.success(`Statut mis à jour : ${status}`)),
      catchError(this.handleError('Erreur lors de la mise à jour du statut')),
      finalize(() => this._loading.set(false))
    );
  }

  /**
   * Journal d'audit global (SaaS Level)
   * Endpoint: GET /audit
   */
  getGlobalAuditLogs(page: number = 0, size: number = 20): Observable<Page<AuditLog>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<Page<AuditLog>>(`${this.IDENTITY_API_URL}/audit`, { params }).pipe(
      catchError(this.handleError('Erreur lors du chargement du journal d\'audit global'))
    );
  }
}
