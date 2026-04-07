import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import {
  AdmissionApplication,
  ApplicationCreateRequest,
  ReEnrollRequest,
  CandidateUpdateRequest,
  Guardian,
  EnrollmentConfig,
  RequiredDocumentConfig,
  CoreFieldControl,
  CustomFieldConfig,
  AssessmentConfig
} from '../models/enrollment.model';
import { TenantContextService } from './tenant-context.service';
import { EnvironmentService } from './environment.service';
import { NotificationService } from '../../shared/services/notification.service';

export interface PublicPortalSummary {
  tenantId: string;
  portalActive: boolean;
  academicYearLabel: string;
  registrationStartDate: string;
  registrationEndDate: string;
  withinDates: boolean;
  welcomeMessage: string;
  legalText: string;
  enabledServices: string[];
}

export interface EffectiveConfigResponse {
  documentChecklist: RequiredDocumentConfig[];
  coreFieldOverrides: Record<string, CoreFieldControl>;
  formSchema: { customFields: CustomFieldConfig[] };
  assessmentConfig: AssessmentConfig;
  instructions: Record<string, string>;
}

@Injectable({
  providedIn: 'root'
})
export class EnrollmentPublicService {
  private http = inject(HttpClient);
  private tenantContext = inject(TenantContextService);
  private envService = inject(EnvironmentService);
  private notificationService = inject(NotificationService);

  private readonly baseUrl = `${this.envService.getServiceUrl('enrollment')}/public`;

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

  getPortalSummary(): Observable<PublicPortalSummary> {
    return this.http.get<PublicPortalSummary>(`${this.baseUrl}/config/summary`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Impossible de charger le résumé du portail'))
    );
  }

  getEffectiveConfig(levelId?: string): Observable<EffectiveConfigResponse> {
    // On s'assure que l'URL contient bien le segment /config
    const url = levelId ? `${this.baseUrl}/config/${levelId}` : `${this.baseUrl}/config/default`;
    return this.http.get<EffectiveConfigResponse>(url, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Impossible de charger la configuration du formulaire'))
    );
  }

  createApplication(request: ApplicationCreateRequest): Observable<AdmissionApplication> {
    return this.http.post<AdmissionApplication>(`${this.baseUrl}/admissions`, request, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError('Erreur lors de l\'initialisation du dossier'))
    );
  }

  reEnroll(request: ReEnrollRequest): Observable<AdmissionApplication> {
    return this.http.post<AdmissionApplication>(`${this.baseUrl}/admissions/re-enroll`, request, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError('Erreur lors de la réinscription'))
    );
  }

  updateCandidate(applicationId: string, request: CandidateUpdateRequest): Observable<AdmissionApplication> {
    return this.http.patch<AdmissionApplication>(`${this.baseUrl}/admissions/${applicationId}/candidate`, request, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors de la mise à jour du candidat'))
    );
  }

  updateGuardians(applicationId: string, guardian: any): Observable<AdmissionApplication> {
    // Le contrat technique (Section 2.4) attend l'objet GuardianInfo pur.
    // On s'assure qu'aucun champ parasite n'est envoyé.
    const payload = {
      firstName: guardian.firstName,
      lastName: guardian.lastName,
      email: guardian.email,
      phone: guardian.phone,
      relation: guardian.relation,
      address: guardian.address,
      profession: guardian.profession
    };
    return this.http.patch<AdmissionApplication>(`${this.baseUrl}/admissions/${applicationId}/guardians`, payload, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors de la mise à jour des responsables'))
    );
  }

  updateCustomFields(applicationId: string, fields: Record<string, any>): Observable<AdmissionApplication> {
    return this.http.patch<AdmissionApplication>(`${this.baseUrl}/admissions/${applicationId}/custom-fields`, fields, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors de l\'enregistrement des informations spécifiques'))
    );
  }

  updateSubscriptions(applicationId: string, subscriptions: any[]): Observable<AdmissionApplication> {
    return this.http.patch<AdmissionApplication>(`${this.baseUrl}/admissions/${applicationId}/subscriptions`, subscriptions, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors de la gestion des services'))
    );
  }

  uploadDocument(applicationId: string, docCode: string, fileId: string): Observable<AdmissionApplication> {
    const headers = this.getHeaders().set('Content-Type', 'text/plain');
    return this.http.post<AdmissionApplication>(
      `${this.baseUrl}/admissions/${applicationId}/documents/${docCode}`,
      fileId,
      { headers }
    ).pipe(
      catchError(this.handleError('Erreur lors de la liaison du document'))
    );
  }

  submitApplication(applicationId: string): Observable<AdmissionApplication> {
    return this.http.post<AdmissionApplication>(`${this.baseUrl}/admissions/${applicationId}/submit`, {}, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors de la soumission finale'))
    );
  }

  trackApplication(reference: string, accessCode: string): Observable<AdmissionApplication> {
    const params = new HttpParams().set('accessCode', accessCode);
    return this.http.get<AdmissionApplication>(`${this.baseUrl}/admissions/${reference}/track`, { params }).pipe(
      catchError(this.handleError('Dossier introuvable ou code incorrect'))
    );
  }
}
