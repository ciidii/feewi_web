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
    if (tenantId) headers = headers.set('X-Tenant-Id', tenantId);
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

  /** Résumé du portail V5/V6 */
  getPortalSummary(): Observable<PublicPortalSummary> {
    const url = `${this.envService.getServiceUrl('enrollment')}/public/config/summary`;
    return this.http.get<PublicPortalSummary>(url, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Impossible de charger le résumé du portail'))
    );
  }

  /** Configuration dynamique par niveau (Source du moteur de rendu) */
  getEffectiveConfig(levelId: string): Observable<EffectiveConfigResponse> {
    const url = `${this.envService.getServiceUrl('enrollment')}/public/config/${levelId}`;
    return this.http.get<EffectiveConfigResponse>(url, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Impossible de charger la configuration'))
    );
  }

  /** Initialisation V6 (POST /admissions) */
  createApplication(request: CreateBundleRequest): Observable<AdmissionBundleResponse> {
    return this.http.post<AdmissionBundleResponse>(`${this.baseUrl}`, request, {
      headers: this.getHeaders()
    }).pipe(catchError(this.handleError('Erreur initialisation')));
  }

  /** 
   * V6 : Mise à jour d'un pilier Enfant
   * PATCH /admissions/{id}/pillars/{pillarKey}
   */
  updateChildPillar(admissionId: string, pillarKey: string, data: any): Observable<Admission> {
    return this.http.patch<Admission>(`${this.baseUrl}/${admissionId}/pillars/${pillarKey}`, data, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError(`Erreur sur le pilier ${pillarKey}`)));
  }

  /** 
   * V6 : Mise à jour du pilier Famille (Shared)
   * PATCH /admissions/bundles/{id}/pillars/pillar_family
   */
  updateFamilyPillar(bundleId: string, data: any): Observable<AdmissionBundleResponse> {
    return this.http.patch<AdmissionBundleResponse>(`${this.baseUrl}/bundles/${bundleId}/pillars/pillar_family`, data, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError('Erreur sur le volet famille')));
  }

  uploadDocument(admissionId: string, docCode: string, fileId: string): Observable<Admission> {
    const headers = this.getHeaders().set('Content-Type', 'text/plain');
    return this.http.post<Admission>(`${this.baseUrl}/${admissionId}/documents/${docCode}`, fileId, { headers })
      .pipe(catchError(this.handleError('Erreur document')));
  }

  submitApplication(admissionId: string): Observable<Admission> {
    return this.http.post<Admission>(`${this.baseUrl}/${admissionId}/submit`, {}, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError('Erreur soumission')));
  }

  trackApplication(reference: string, accessCode: string): Observable<Admission> {
    const params = new HttpParams().set('accessCode', accessCode);
    return this.http.get<Admission>(`${this.baseUrl}/${reference}/track`, { params })
      .pipe(catchError(this.handleError('Suivi introuvable')));
  }
}
