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
  private readonly adminUrl = `${this.baseUrl}/admin/applications`;
  private readonly directionUrl = `${this.baseUrl}/admin/direction/applications`;

  private handleError(message: string) {
    return (error: any) => {
      console.error(error);
      const errorMessage = error?.error?.message || message;
      this.notificationService.error(errorMessage);
      return throwError(() => error);
    };
  }

  /**
   * Lister tous les dossiers d'admission
   */
  getApplications(): Observable<AdmissionApplication[]> {
    return this.http.get<AdmissionApplication[]>(this.adminUrl).pipe(
      catchError(this.handleError('Erreur lors du chargement des dossiers'))
    );
  }

  /**
   * Recherche globale de dossiers
   */
  searchApplications(query: string): Observable<AdmissionApplication[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<AdmissionApplication[]>(`${this.adminUrl}/search`, { params }).pipe(
      catchError(this.handleError('Erreur lors de la recherche'))
    );
  }

  /**
   * Récupérer un dossier spécifique
   */
  getApplicationById(id: string): Observable<AdmissionApplication> {
    return this.http.get<AdmissionApplication>(`${this.adminUrl}/${id}`).pipe(
      catchError(this.handleError('Impossible de récupérer le dossier'))
    );
  }

  /**
   * Récupérer le récépissé d'un dossier
   */
  getApplicationReceipt(id: string): Observable<any> {
    return this.http.get(`${this.adminUrl}/${id}/receipt`).pipe(
      catchError(this.handleError('Impossible de générer le récépissé'))
    );
  }

  /**
   * Saisie directe (Guichet)
   */
  directEntry(request: any): Observable<AdmissionApplication> {
    return this.http.post<AdmissionApplication>(`${this.adminUrl}/direct`, request).pipe(
      catchError(this.handleError('Erreur lors de la saisie directe'))
    );
  }

  /**
   * Marquer un document comme reçu physiquement
   */
  receivePhysicalDocument(applicationId: string, docCode: string): Observable<AdmissionApplication> {
    return this.http.patch<AdmissionApplication>(
      `${this.adminUrl}/${applicationId}/documents/${docCode}/receive`,
      {}
    ).pipe(
      catchError(this.handleError('Erreur lors de la validation du document'))
    );
  }

  /**
   * Valider la conformité administrative
   */
  verifyApplication(applicationId: string): Observable<AdmissionApplication> {
    return this.http.patch<AdmissionApplication>(`${this.adminUrl}/${applicationId}/verify`, {}).pipe(
      catchError(this.handleError('Erreur lors de la vérification administrative'))
    );
  }

  /**
   * Saisir les résultats de l'évaluation pédagogique
   */
  submitAssessment(applicationId: string, assessment: AssessmentRequest): Observable<AdmissionApplication> {
    return this.http.patch<AdmissionApplication>(
      `${this.adminUrl}/${applicationId}/assessment`,
      assessment
    ).pipe(
      catchError(this.handleError('Erreur lors de l\'enregistrement de l\'évaluation'))
    );
  }

  /**
   * Annulation administrative d'un dossier
   */
  cancelApplicationAdmin(applicationId: string): Observable<AdmissionApplication> {
    return this.http.post<AdmissionApplication>(`${this.adminUrl}/${applicationId}/cancel`, {}).pipe(
      catchError(this.handleError('Erreur lors de l\'annulation du dossier'))
    );
  }

  // --- API DIRECTION ---

  /**
   * Validation finale par la Direction
   */
  validateAdmission(applicationId: string): Observable<AdmissionApplication> {
    return this.http.patch<AdmissionApplication>(`${this.directionUrl}/${applicationId}/validate`, {}).pipe(
      catchError(this.handleError('Erreur lors de la validation finale'))
    );
  }

  /**
   * Refus définitif d'un dossier
   */
  rejectAdmission(applicationId: string, reason: string): Observable<AdmissionApplication> {
    return this.http.patch<AdmissionApplication>(`${this.directionUrl}/${applicationId}/reject`, JSON.stringify(reason), {
      headers: { 'Content-Type': 'application/json' }
    }).pipe(
      catchError(this.handleError('Erreur lors du rejet du dossier'))
    );
  }

  /**
   * Mise en liste d'attente
   */
  waitlistAdmission(applicationId: string): Observable<AdmissionApplication> {
    return this.http.patch<AdmissionApplication>(`${this.directionUrl}/${applicationId}/waitlist`, {}).pipe(
      catchError(this.handleError('Erreur lors de la mise en liste d\'attente'))
    );
  }

  /**
   * Validation par lot
   */
  bulkValidateAdmissions(ids: string[]): Observable<void> {
    return this.http.post<void>(`${this.directionUrl}/bulk-validate`, ids).pipe(
      catchError(this.handleError('Erreur lors de la validation groupée'))
    );
  }

  /**
   * Récupérer la configuration du service Enrollment
   */
  getConfig(): Observable<EnrollmentConfig> {
    return this.http.get<EnrollmentConfig>(`${this.baseUrl}/admin/config`).pipe(
      catchError(this.handleError('Impossible de charger la configuration'))
    );
  }

  /**
   * Mettre à jour la configuration
   */
  updateConfig(config: EnrollmentConfig): Observable<EnrollmentConfig> {
    return this.http.put<EnrollmentConfig>(`${this.baseUrl}/admin/config`, config).pipe(
      catchError(this.handleError('Erreur lors de la mise à jour de la configuration'))
    );
  }
}
