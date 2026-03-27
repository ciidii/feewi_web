import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  AdmissionApplication, 
  ApplicationCreateRequest, 
  ReEnrollRequest, 
  CandidateUpdateRequest, 
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

  private getHeaders(): HttpHeaders {
    const tenantId = this.tenantContext.activeTenant()?.id;
    let headers = new HttpHeaders();
    if (tenantId) {
      headers = headers.set('X-Tenant-Id', tenantId);
    }
    return headers;
  }

  createApplication(request: ApplicationCreateRequest): Observable<AdmissionApplication> {
    return this.http.post<AdmissionApplication>(`${this.baseUrl}/`, request, {
      headers: this.getHeaders()
    });
  }

  reEnroll(request: ReEnrollRequest): Observable<AdmissionApplication> {
    return this.http.post<AdmissionApplication>(`${this.baseUrl}/re-enroll`, request, {
      headers: this.getHeaders()
    });
  }

  updateCandidate(applicationId: string, request: CandidateUpdateRequest): Observable<AdmissionApplication> {
    return this.http.patch<AdmissionApplication>(`${this.baseUrl}/${applicationId}/candidate`, request);
  }

  updateGuardians(applicationId: string, guardian: Guardian): Observable<AdmissionApplication> {
    return this.http.patch<AdmissionApplication>(`${this.baseUrl}/${applicationId}/guardians`, guardian);
  }

  updateSubscriptions(applicationId: string, subscriptions: any[]): Observable<AdmissionApplication> {
    return this.http.patch<AdmissionApplication>(`${this.baseUrl}/${applicationId}/subscriptions`, subscriptions);
  }

  uploadDocument(applicationId: string, docCode: string, fileUrl: string): Observable<AdmissionApplication> {
    return this.http.post<AdmissionApplication>(
      `${this.baseUrl}/${applicationId}/documents/${docCode}`, 
      JSON.stringify(fileUrl), 
      { headers: new HttpHeaders().set('Content-Type', 'application/json') }
    );
  }

  trackApplication(reference: string, accessCode: string): Observable<AdmissionApplication> {
    const params = new HttpParams().set('accessCode', accessCode);
    return this.http.get<AdmissionApplication>(`${this.baseUrl}/${reference}/track`, { params });
  }

  getMyApplications(email: string): Observable<AdmissionApplication[]> {
    const params = new HttpParams().set('email', email);
    return this.http.get<AdmissionApplication[]>(`${this.baseUrl}/mine`, { 
      headers: this.getHeaders(),
      params 
    });
  }

  submitApplication(applicationId: string): Observable<AdmissionApplication> {
    return this.http.post<AdmissionApplication>(`${this.baseUrl}/${applicationId}/submit`, {});
  }

  cancelApplication(applicationId: string): Observable<AdmissionApplication> {
    return this.http.post<AdmissionApplication>(`${this.baseUrl}/${applicationId}/cancel`, {});
  }
}
