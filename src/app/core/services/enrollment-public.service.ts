import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  AdmissionApplication, 
  ApplicationCreateRequest, 
  ReEnrollRequest, 
  Candidate, 
  Guardian 
} from '../models/enrollment.model';
import { TenantContextService } from './tenant-context.service';

@Injectable({
  providedIn: 'root'
})
export class EnrollmentPublicService {
  private http = inject(HttpClient);
  private tenantContext = inject(TenantContextService);
  
  private readonly baseUrl = '/enrollment/api/v1/public/applications';

  /**
   * Helper pour construire les headers avec le X-Tenant-Id
   */
  private getHeaders(): HttpHeaders {
    const tenantId = this.tenantContext.activeTenant()?.id;
    let headers = new HttpHeaders();
    if (tenantId) {
      headers = headers.set('X-Tenant-Id', tenantId);
    }
    return headers;
  }

  /**
   * Créer un nouveau dossier d'admission (Mode Anonyme)
   */
  createApplication(request: ApplicationCreateRequest): Observable<AdmissionApplication> {
    return this.http.post<AdmissionApplication>(this.baseUrl, request, {
      headers: this.getHeaders()
    });
  }

  /**
   * Créer un dossier de réinscription (Soft-Enrollment)
   */
  reEnroll(request: ReEnrollRequest): Observable<AdmissionApplication> {
    return this.http.post<AdmissionApplication>(`${this.baseUrl}/re-enroll`, request, {
      headers: this.getHeaders()
    });
  }

  /**
   * Mettre à jour les informations du candidat (Uniquement en DRAFT)
   */
  updateCandidate(applicationId: string, candidate: Candidate): Observable<AdmissionApplication> {
    return this.http.patch<AdmissionApplication>(`${this.baseUrl}/${applicationId}/candidate`, candidate);
  }

  /**
   * Mettre à jour les responsables (Uniquement en DRAFT)
   */
  updateGuardians(applicationId: string, guardians: Guardian[]): Observable<AdmissionApplication> {
    return this.http.patch<AdmissionApplication>(`${this.baseUrl}/${applicationId}/guardians`, guardians);
  }

  /**
   * Uploader un document justificatif
   */
  uploadDocument(applicationId: string, docCode: string, fileUrl: string): Observable<AdmissionApplication> {
    return this.http.post<AdmissionApplication>(`${this.baseUrl}/${applicationId}/documents/${docCode}`, { fileUrl });
  }

  /**
   * Suivre l'avancement d'un dossier (Tracker)
   * @param reference Référence du dossier (ex: ADM-2026-XXXX)
   * @param accessCode Code d'accès secret généré à la création
   */
  trackApplication(reference: string, accessCode: string): Observable<AdmissionApplication> {
    const params = new HttpParams().set('accessCode', accessCode);
    return this.http.get<AdmissionApplication>(`${this.baseUrl}/${reference}/track`, { params });
  }

  /**
   * Soumission finale du dossier (Verrouille le dossier)
   */
  submitApplication(applicationId: string): Observable<AdmissionApplication> {
    return this.http.post<AdmissionApplication>(`${this.baseUrl}/${applicationId}/submit`, {});
  }
}
