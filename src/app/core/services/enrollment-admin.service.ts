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
  
  private readonly baseUrl = '/enrollment/api/v1/admin';

  /**
   * Lister tous les dossiers d'admission du tenant actuel
   */
  getApplications(): Observable<AdmissionApplication[]> {
    return this.http.get<AdmissionApplication[]>(`${this.baseUrl}/applications`);
  }

  /**
   * Récupérer un dossier spécifique par son ID
   */
  getApplicationById(id: string): Observable<AdmissionApplication> {
    return this.http.get<AdmissionApplication>(`${this.baseUrl}/applications/${id}`);
  }

  /**
   * Marquer un document comme reçu physiquement au guichet
   */
  receivePhysicalDocument(applicationId: string, docCode: string): Observable<AdmissionApplication> {
    return this.http.patch<AdmissionApplication>(
      `${this.baseUrl}/applications/${applicationId}/documents/${docCode}/receive`, 
      {}
    );
  }

  /**
   * Valider la conformité administrative du dossier
   * (Passe le dossier en état VERIFIED)
   */
  verifyApplication(applicationId: string): Observable<AdmissionApplication> {
    return this.http.patch<AdmissionApplication>(
      `${this.baseUrl}/applications/${applicationId}/verify`, 
      {}
    );
  }

  /**
   * Saisir les résultats de l'évaluation pédagogique (Test de niveau)
   */
  submitAssessment(applicationId: string, assessment: AssessmentRequest): Observable<AdmissionApplication> {
    return this.http.patch<AdmissionApplication>(
      `${this.baseUrl}/applications/${applicationId}/assessment`, 
      assessment
    );
  }

  /**
   * Validation finale par la Direction (Admission définitive)
   * Déclenche le "Verrou Numérique" côté backend.
   */
  validateAdmission(applicationId: string): Observable<AdmissionApplication> {
    return this.http.patch<AdmissionApplication>(
      `${this.baseUrl}/direction/applications/${applicationId}/validate`, 
      {}
    );
  }

  /**
   * Récupérer la configuration du service Enrollment pour l'école
   */
  getConfig(): Observable<EnrollmentConfig> {
    return this.http.get<EnrollmentConfig>(`${this.baseUrl}/config`);
  }

  /**
   * Mettre à jour la configuration (Checklist, Schéma de formulaire, etc.)
   */
  updateConfig(config: EnrollmentConfig): Observable<EnrollmentConfig> {
    return this.http.put<EnrollmentConfig>(`${this.baseUrl}/config`, config);
  }
}
