import {HttpClient, HttpHeaders, HttpParams} from "@angular/common/http";
import {inject, Injectable} from "@angular/core";
import {EnvironmentService} from "./environment.service";
import {NotificationService} from "../../shared/services/notification.service";
import {TenantContextService} from "./tenant-context.service";
import {catchError, Observable, throwError} from "rxjs";
import {
  AdmissionApplication,
  AdmissionStatus,
  AssessmentRequest,
  EnrollmentConfig,
  LevelOverrideConfig
} from '../models/enrollment.model';
import { Page } from "../models/school.model";


@Injectable({
  providedIn: 'root'
})
export class EnrollmentAdminService {
  private http = inject(HttpClient);
  private envService = inject(EnvironmentService);
  private notificationService = inject(NotificationService);
  private tenantContext = inject(TenantContextService);
  private readonly baseUrl = this.envService.getServiceUrl('enrollment');

  private getHeaders(): HttpHeaders {
    const tenantId = this.tenantContext.activeTenant()?.id || 'default';
    return new HttpHeaders().set('X-Tenant-Id', tenantId);
  }

  private handleError(message: string) {
    return (error: any) => {
      console.error(error);
      const errorMessage = error?.error?.message || message;
      this.notificationService.error(errorMessage);
      return throwError(() => error);
    };
  }

  // --- GESTION DES DOSSIERS ---

  /**
   * Liste & Recherche Avancée (Paginée) - API V1
   */
  getApplications(params: {
    q?: string,
    status?: AdmissionStatus,
    levelId?: string,
    academicYearId?: string,
    channel?: 'DIGITAL' | 'DIRECT',
    page?: number,
    size?: number
  } = {}): Observable<Page<AdmissionApplication>> {
    let httpParams = new HttpParams();
    if (params.q) httpParams = httpParams.set('q', params.q);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.levelId) httpParams = httpParams.set('levelId', params.levelId);
    if (params.academicYearId) httpParams = httpParams.set('academicYearId', params.academicYearId);
    if (params.channel) httpParams = httpParams.set('channel', params.channel);
    if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params.size !== undefined) httpParams = httpParams.set('size', params.size.toString());

    return this.http.get<Page<AdmissionApplication>>(`${this.baseUrl}/admin/admissions`, {
      params: httpParams,
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError('Erreur lors du chargement des dossiers'))
    );
  }

  getApplicationById(id: string): Observable<AdmissionApplication> {
    return this.http.get<AdmissionApplication>(`${this.baseUrl}/admin/admissions/${id}/details`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Impossible de récupérer le dossier'))
    );
  }

  /**
   * Saisie directe au guichet (Secretariat)
   */
  createDirectApplication(request: any): Observable<AdmissionApplication> {
    return this.http.post<AdmissionApplication>(`${this.baseUrl}/admin/admissions/direct`, request, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors de la création du dossier direct'))
    );
  }

  // --- CONFIGURATION DU PORTAIL ---

  /**
   * Récupérer la configuration (Endpoint: /enrollment/api/v1/admin/config)
   */
  getConfig(): Observable<EnrollmentConfig> {
    return this.http.get<EnrollmentConfig>(`${this.baseUrl}/admin/config`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Impossible de charger la configuration du portail'))
    );
  }

  /**
   * Mettre à jour la configuration (Endpoint: /enrollment/api/v1/admin/config)
   */
  updateConfig(config: EnrollmentConfig): Observable<EnrollmentConfig> {
    return this.http.put<EnrollmentConfig>(`${this.baseUrl}/admin/config`, config, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors de la mise à jour de la configuration'))
    );
  }

  /**
   * Gérer l'état du portail (Master Switch)
   * Endpoint: PATCH /admin/config/portal-status?active=true|false
   */
  updatePortalStatus(active: boolean): Observable<void> {
    const params = new HttpParams().set('active', active.toString());
    return this.http.patch<void>(`${this.baseUrl}/admin/config/portal-status`, {}, { params, headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors du changement de statut du portail'))
    );
  }

  /**
   * Personnaliser un niveau spécifique (Surcharge)
   * Endpoint: PATCH /admin/config/level-overrides/{levelId}
   */
  updateLevelOverride(levelId: string, override: LevelOverrideConfig): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/admin/config/level-overrides/${levelId}`, override, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors de la personnalisation du niveau'))
    );
  }

  /**
   * Récupère la configuration effective pour un niveau (Fusion Global + Surcharges)
   * On utilise le endpoint public car c'est lui qui gère la fusion.
   */
  getEffectiveConfig(levelId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/public/config/${levelId}`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Impossible de charger la configuration effective du niveau'))
    );
  }

  // --- ACTIONS MÉTIER ---

  receivePhysicalDocument(applicationId: string, docCode: string): Observable<AdmissionApplication> {
    return this.http.patch<AdmissionApplication>(
      `${this.baseUrl}/admin/admissions/${applicationId}/documents/${docCode}/receive`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError('Erreur lors de la validation du document'))
    );
  }

  /**
   * Lier un fichier uploadé à un document du dossier
   * Note: On utilise le point d'accès public car l'action de liaison est partagée
   */
  linkDocument(applicationId: string, docCode: string, fileId: string): Observable<AdmissionApplication> {
    const headers = this.getHeaders().set('Content-Type', 'text/plain');
    // On appelle /public/admissions/... au lieu de /admin/admissions/...
    return this.http.post<AdmissionApplication>(
      `${this.baseUrl}/public/admissions/${applicationId}/documents/${docCode}`,
      fileId,
      { headers }
    ).pipe(
      catchError(this.handleError('Erreur lors de la liaison du document numérisé'))
    );
  }

  verifyApplication(applicationId: string): Observable<AdmissionApplication> {
    return this.http.patch<AdmissionApplication>(`${this.baseUrl}/admin/admissions/${applicationId}/verify`, {}, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors de la vérification administrative'))
    );
  }

  submitAssessment(applicationId: string, assessment: AssessmentRequest): Observable<AdmissionApplication> {
    return this.http.patch<AdmissionApplication>(
      `${this.baseUrl}/admin/admissions/${applicationId}/assessment`,
      assessment,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError('Erreur lors de l\'enregistrement de l\'évaluation'))
    );
  }

  // --- API DIRECTION ---

  validateAdmission(applicationId: string): Observable<AdmissionApplication> {
    return this.http.patch<AdmissionApplication>(`${this.baseUrl}/admin/direction/admissions/${applicationId}/validate`, {}, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors de la validation finale'))
    );
  }

  overruleAdmission(applicationId: string): Observable<AdmissionApplication> {
    return this.http.patch<AdmissionApplication>(`${this.baseUrl}/admin/direction/admissions/${applicationId}/overrule`, {}, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors de la validation avec dérogation'))
    );
  }

  rejectAdmission(applicationId: string, reason: string): Observable<AdmissionApplication> {
    return this.http.patch<AdmissionApplication>(
      `${this.baseUrl}/admin/direction/admissions/${applicationId}/reject`,
      JSON.stringify(reason),
      { headers: this.getHeaders().set('Content-Type', 'application/json') }
    ).pipe(
      catchError(this.handleError('Erreur lors du rejet du dossier'))
    );
  }
}
