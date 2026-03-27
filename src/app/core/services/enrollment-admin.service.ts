import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AdmissionApplication,
  AssessmentRequest,
  EnrollmentConfig
} from '../models/enrollment.model';

@Injectable({
  providedIn: 'root'
})
export class EnrollmentAdminService {
  private http = inject(HttpClient);

  private readonly adminUrl = '/enrollment/api/v1/admin/applications';
  private readonly directionUrl = '/enrollment/api/v1/admin/direction/applications';

  /**
   * Lister tous les dossiers d'admission (Pas de slash final)
   */
  getApplications(): Observable<AdmissionApplication[]> {
    return this.http.get<AdmissionApplication[]>(this.adminUrl);
  }

  /**
   * Recherche globale de dossiers
   */
  searchApplications(query: string): Observable<AdmissionApplication[]> {
    return this.http.get<AdmissionApplication[]>(`${this.adminUrl}/search`, {
      params: { q: query }
    });
  }

  /**
   * Récupérer un dossier spécifique
   */
  getApplicationById(id: string): Observable<AdmissionApplication> {
    return this.http.get<AdmissionApplication>(`${this.adminUrl}/${id}`);
  }

  /**
   * Récupérer le récépissé d'un dossier
   */
  getApplicationReceipt(id: string): Observable<any> {
    return this.http.get(`${this.adminUrl}/${id}/receipt`);
  }

  /**
   * Saisie directe (Guichet)
   */
  directEntry(request: any): Observable<AdmissionApplication> {
    return this.http.post<AdmissionApplication>(`${this.adminUrl}/direct`, request);
  }

  /**
   * Marquer un document comme reçu physiquement
   */
  receivePhysicalDocument(applicationId: string, docCode: string): Observable<AdmissionApplication> {
    return this.http.patch<AdmissionApplication>(
      `${this.adminUrl}/${applicationId}/documents/${docCode}/receive`,
      {}
    );
  }

  /**
   * Valider la conformité administrative
   */
  verifyApplication(applicationId: string): Observable<AdmissionApplication> {
    return this.http.patch<AdmissionApplication>(`${this.adminUrl}/${applicationId}/verify`, {});
  }

  /**
   * Saisir les résultats de l'évaluation pédagogique
   */
  submitAssessment(applicationId: string, assessment: AssessmentRequest): Observable<AdmissionApplication> {
    return this.http.patch<AdmissionApplication>(
      `${this.adminUrl}/${applicationId}/assessment`,
      assessment
    );
  }

  /**
   * Annulation administrative d'un dossier
   */
  cancelApplicationAdmin(applicationId: string): Observable<AdmissionApplication> {
    return this.http.post<AdmissionApplication>(`${this.adminUrl}/${applicationId}/cancel`, {});
  }

  // --- API DIRECTION ---

  /**
   * Validation finale par la Direction
   */
  validateAdmission(applicationId: string): Observable<AdmissionApplication> {
    return this.http.patch<AdmissionApplication>(`${this.directionUrl}/${applicationId}/validate`, {});
  }

  /**
   * Refus définitif d'un dossier
   */
  rejectAdmission(applicationId: string, reason: string): Observable<AdmissionApplication> {
    return this.http.patch<AdmissionApplication>(`${this.directionUrl}/${applicationId}/reject`, JSON.stringify(reason), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  /**
   * Mise en liste d'attente
   */
  waitlistAdmission(applicationId: string): Observable<AdmissionApplication> {
    return this.http.patch<AdmissionApplication>(`${this.directionUrl}/${applicationId}/waitlist`, {});
  }

  /**
   * Validation par lot
   */
  bulkValidateAdmissions(ids: string[]): Observable<void> {
    return this.http.post<void>(`${this.directionUrl}/bulk-validate`, ids);
  }

  /**
   * Récupérer la configuration du service Enrollment
   */
  getConfig(): Observable<EnrollmentConfig> {
    return this.http.get<EnrollmentConfig>(`/enrollment/api/v1/admin/config`);
  }

  /**
   * Mettre à jour la configuration
   */
  updateConfig(config: EnrollmentConfig): Observable<EnrollmentConfig> {
    return this.http.put<EnrollmentConfig>(`/enrollment/api/v1/admin/config`, config);
  }}
