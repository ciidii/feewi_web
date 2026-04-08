import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import {
  Admission,
  AdmissionBundleResponse,
  CreateBundleRequest,
  ReEnrollRequest,
  EffectiveConfigResponse,
  PublicPortalSummary
} from '../models/enrollment.model';
import { TenantContextService } from './tenant-context.service';
import { EnvironmentService } from './environment.service';
import { NotificationService } from '../../shared/services/notification.service';

@Injectable({
  providedIn: 'root'
})
export class EnrollmentPublicService {
  private http = inject(HttpClient);
  private tenantContext = inject(TenantContextService);
  private envService = inject(EnvironmentService);
  private notificationService = inject(NotificationService);

  private readonly baseUrl = `${this.envService.getServiceUrl('enrollment')}/public/admissions`;

  private getHeaders(): HttpHeaders {
    const tenantId = this.tenantContext.activeTenant()?.id;
    let headers = new HttpHeaders();
    if (tenantId) {
      headers = headers.set('X-Tenant-Id', tenantId);
    }
    return headers;
  }

  private handleError(message: string) {
    return (error: any) => {
      console.error(error);
      const errorMessage = error?.error?.message || message;
      this.notificationService.error(errorMessage);
      return throwError(() => error);
    };
  }

  /** Résumé du portail (Landing Page) */
  getPortalSummary(): Observable<PublicPortalSummary> {
    const url = `${this.envService.getServiceUrl('enrollment')}/public/config/summary`;
    return this.http.get<PublicPortalSummary>(url, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Impossible de charger le résumé du portail'))
    );
  }

  /** Configuration du formulaire par niveau (Piliers & Checklist) */
  getEffectiveConfig(levelId: string): Observable<EffectiveConfigResponse> {
    const url = `${this.envService.getServiceUrl('enrollment')}/public/config/${levelId}`;
    return this.http.get<EffectiveConfigResponse>(url, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Impossible de charger la configuration du formulaire'))
    );
  }

  /** Initialisation d'un dossier familial (Bundle) */
  createApplication(request: CreateBundleRequest): Observable<AdmissionBundleResponse> {
    return this.http.post<AdmissionBundleResponse>(`${this.baseUrl}`, request, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError('Erreur lors de l\'initialisation du dossier familial'))
    );
  }

  /** Réinscription simplifiée */
  reEnroll(request: ReEnrollRequest): Observable<Admission> {
    return this.http.post<Admission>(`${this.baseUrl}/re-enroll`, request, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError('Erreur lors de la réinscription'))
    );
  }

  /** 
   * Mise à jour d'un pilier spécifique pour un enfant 
   * (identity, medical, schooling, family)
   */
  updatePillar(admissionId: string, pillarName: 'identity' | 'medical' | 'schooling' | 'family', data: any): Observable<Admission> {
    return this.http.patch<Admission>(`${this.baseUrl}/${admissionId}/${pillarName}`, { data }, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError(`Erreur lors de la mise à jour du pilier ${pillarName}`))
    );
  }

  /** Liaison d'un document numérisé */
  uploadDocument(admissionId: string, docCode: string, fileId: string): Observable<Admission> {
    const headers = this.getHeaders().set('Content-Type', 'text/plain');
    return this.http.post<Admission>(
      `${this.baseUrl}/${admissionId}/documents/${docCode}`,
      fileId,
      { headers }
    ).pipe(
      catchError(this.handleError('Erreur lors de la liaison du document'))
    );
  }

  /** Soumission finale du dossier */
  submitApplication(admissionId: string): Observable<Admission> {
    return this.http.post<Admission>(`${this.baseUrl}/${admissionId}/submit`, {}, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors de la soumission finale'))
    );
  }

  /** Suivi d'un dossier individuel */
  trackApplication(reference: string, accessCode: string): Observable<Admission> {
    const params = new HttpParams().set('accessCode', accessCode);
    return this.http.get<Admission>(`${this.baseUrl}/${reference}/track`, { params }).pipe(
      catchError(this.handleError('Dossier introuvable ou code incorrect'))
    );
  }
}
