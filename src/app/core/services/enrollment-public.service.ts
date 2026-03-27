import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { 
  AdmissionApplication, 
  ApplicationCreateRequest, 
  ReEnrollRequest, 
  CandidateUpdateRequest, 
  Guardian 
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
  
  private readonly baseUrl = `${this.envService.getServiceUrl('enrollment')}/public/applications`;

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

  createApplication(request: ApplicationCreateRequest): Observable<AdmissionApplication> {
    return this.http.post<AdmissionApplication>(`${this.baseUrl}/`, request, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError('Erreur lors de la création du dossier'))
    );
  }

  reEnroll(request: ReEnrollRequest): Observable<AdmissionApplication> {
    return this.http.post<AdmissionApplication>(`${this.baseUrl}/re-enroll`, request, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError('Erreur lors de la réinscription'))
    );
  }

  updateCandidate(applicationId: string, request: CandidateUpdateRequest): Observable<AdmissionApplication> {
    return this.http.patch<AdmissionApplication>(`${this.baseUrl}/${applicationId}/candidate`, request).pipe(
      catchError(this.handleError('Erreur lors de la mise à jour du candidat'))
    );
  }

  updateGuardians(applicationId: string, guardian: Guardian): Observable<AdmissionApplication> {
    return this.http.patch<AdmissionApplication>(`${this.baseUrl}/${applicationId}/guardians`, guardian).pipe(
      catchError(this.handleError('Erreur lors de la mise à jour des responsables'))
    );
  }

  updateSubscriptions(applicationId: string, subscriptions: any[]): Observable<AdmissionApplication> {
    return this.http.patch<AdmissionApplication>(`${this.baseUrl}/${applicationId}/subscriptions`, subscriptions).pipe(
      catchError(this.handleError('Erreur lors de la mise à jour des abonnements'))
    );
  }

  uploadDocument(applicationId: string, docCode: string, fileId: string): Observable<AdmissionApplication> {
    // Note: On envoie le fileId et non l'URL pour la liaison métier
    return this.http.post<AdmissionApplication>(
      `${this.baseUrl}/${applicationId}/documents/${docCode}`, 
      JSON.stringify(fileId), 
      { headers: new HttpHeaders().set('Content-Type', 'application/json') }
    ).pipe(
      catchError(this.handleError('Erreur lors de la liaison du document'))
    );
  }

  trackApplication(reference: string, accessCode: string): Observable<AdmissionApplication> {
    const params = new HttpParams().set('accessCode', accessCode);
    return this.http.get<AdmissionApplication>(`${this.baseUrl}/${reference}/track`, { params }).pipe(
      catchError(this.handleError('Dossier introuvable ou code incorrect'))
    );
  }

  getMyApplications(email: string): Observable<AdmissionApplication[]> {
    const params = new HttpParams().set('email', email);
    return this.http.get<AdmissionApplication[]>(`${this.baseUrl}/mine`, { 
      headers: this.getHeaders(),
      params 
    }).pipe(
      catchError(this.handleError('Erreur lors de la récupération de vos dossiers'))
    );
  }

  submitApplication(applicationId: string): Observable<AdmissionApplication> {
    return this.http.post<AdmissionApplication>(`${this.baseUrl}/${applicationId}/submit`, {}).pipe(
      catchError(this.handleError('Erreur lors de la soumission finale'))
    );
  }

  cancelApplication(applicationId: string): Observable<AdmissionApplication> {
    return this.http.post<AdmissionApplication>(`${this.baseUrl}/${applicationId}/cancel`, {}).pipe(
      catchError(this.handleError('Erreur lors de l\'annulation du dossier'))
    );
  }
}
