import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import {
  AdmissionApplication,
  AssessmentRequest,
  EnrollmentConfig
} from '../models/enrollment.model';
import { EnvironmentService } from './environment.service';
import { NotificationService } from '../../shared/services/notification.service';

@Injectable({
  providedIn: 'root'
})
export class EnrollmentAdminService {
  private http = inject(HttpClient);
  private envService = inject(EnvironmentService);
  private notificationService = inject(NotificationService);

  private readonly baseUrl = this.envService.getServiceUrl('enrollment');

  private handleError(message: string) {
    return (error: any) => {
      console.error(error);
      const errorMessage = error?.error?.message || message;
      this.notificationService.error(errorMessage);
      return throwError(() => error);
    };
  }

  // --- GESTION DES DOSSIERS ---

  getApplications(): Observable<AdmissionApplication[]> {
    return this.http.get<AdmissionApplication[]>(`${this.baseUrl}/admin/applications`).pipe(
      catchError(this.handleError('Erreur lors du chargement des dossiers'))
    );
  }

  searchApplications(query: string): Observable<AdmissionApplication[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<AdmissionApplication[]>(`${this.baseUrl}/admin/applications/search`, { params }).pipe(
      catchError(this.handleError('Erreur lors de la recherche'))
    );
  }

  getApplicationById(id: string): Observable<AdmissionApplication> {
    return this.http.get<AdmissionApplication>(`${this.baseUrl}/admin/applications/${id}`).pipe(
      catchError(this.handleError('Impossible de récupérer le dossier'))
    );
  }

  // --- CONFIGURATION DU PORTAIL ---

  /**
   * Récupérer la configuration (Endpoint: /enrollment/api/v1/admin/config)
   */
  getConfig(): Observable<EnrollmentConfig> {
    return this.http.get<EnrollmentConfig>(`${this.baseUrl}/admin/config`).pipe(
      catchError(this.handleError('Impossible de charger la configuration du portail'))
    );
  }

  /**
   * Mettre à jour la configuration (Endpoint: /enrollment/api/v1/admin/config)
   */
  updateConfig(config: EnrollmentConfig): Observable<EnrollmentConfig> {
    return this.http.put<EnrollmentConfig>(`${this.baseUrl}/admin/config`, config).pipe(
      catchError(this.handleError('Erreur lors de la mise à jour de la configuration'))
    );
  }

  // --- ACTIONS MÉTIER ---

  receivePhysicalDocument(applicationId: string, docCode: string): Observable<AdmissionApplication> {
    return this.http.patch<AdmissionApplication>(
      `${this.baseUrl}/admin/applications/${applicationId}/documents/${docCode}/receive`,
      {}
    ).pipe(
      catchError(this.handleError('Erreur lors de la validation du document'))
    );
  }

  verifyApplication(applicationId: string): Observable<AdmissionApplication> {
    return this.http.patch<AdmissionApplication>(`${this.baseUrl}/admin/applications/${applicationId}/verify`, {}).pipe(
      catchError(this.handleError('Erreur lors de la vérification administrative'))
    );
  }

  submitAssessment(applicationId: string, assessment: AssessmentRequest): Observable<AdmissionApplication> {
    return this.http.patch<AdmissionApplication>(
      `${this.baseUrl}/admin/applications/${applicationId}/assessment`,
      assessment
    ).pipe(
      catchError(this.handleError('Erreur lors de l\'enregistrement de l\'évaluation'))
    );
  }

  // --- API DIRECTION ---

  validateAdmission(applicationId: string): Observable<AdmissionApplication> {
    return this.http.patch<AdmissionApplication>(`${this.baseUrl}/admin/direction/applications/${applicationId}/validate`, {}).pipe(
      catchError(this.handleError('Erreur lors de la validation finale'))
    );
  }

  rejectAdmission(applicationId: string, reason: string): Observable<AdmissionApplication> {
    return this.http.patch<AdmissionApplication>(
      `${this.baseUrl}/admin/direction/applications/${applicationId}/reject`,
      JSON.stringify(reason),
      { headers: { 'Content-Type': 'application/json' } }
    ).pipe(
      catchError(this.handleError('Erreur lors du rejet du dossier'))
    );
  }
}
