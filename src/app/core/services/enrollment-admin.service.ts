import {HttpClient, HttpHeaders, HttpParams} from "@angular/common/http";
import {inject, Injectable} from "@angular/core";
import {EnvironmentService} from "./environment.service";
import {NotificationService} from "../../shared/services/notification.service";
import {TenantContextService} from "./tenant-context.service";
import {catchError, Observable, throwError} from "rxjs";
import {
  Admission,
  AdmissionPageResponse,
  AdmissionStatus,
  EffectiveConfigResponse,
  EnrollmentConfig,
  LevelOverrideConfig,
  FastEntryRequest,
  AssessmentRequest
} from '../models/enrollment.model';

@Injectable({
  providedIn: 'root'
})
export class EnrollmentAdminService {
  private http = inject(HttpClient);
  private envService = inject(EnvironmentService);
  private notificationService = inject(NotificationService);
  private tenantContext = inject(TenantContextService);
  private readonly baseUrl = `${this.envService.getServiceUrl('enrollment')}/admin`;

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
   * Liste & Recherche Avancée (Paginée) - Vision V3
   */
  getApplications(params: {
    q?: string,
    status?: AdmissionStatus,
    levelId?: string,
    academicYearId?: string,
    channel?: 'DIGITAL' | 'DIRECT',
    page?: number,
    size?: number
  } = {}): Observable<AdmissionPageResponse> {
    let httpParams = new HttpParams();
    if (params.q) httpParams = httpParams.set('q', params.q);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.levelId) httpParams = httpParams.set('levelId', params.levelId);
    if (params.academicYearId) httpParams = httpParams.set('academicYearId', params.academicYearId);
    if (params.channel) httpParams = httpParams.set('channel', params.channel);
    if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params.size !== undefined) httpParams = httpParams.set('size', params.size.toString());

    return this.http.get<AdmissionPageResponse>(`${this.baseUrl}/admissions`, {
      params: httpParams,
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError('Erreur lors du chargement des dossiers'))
    );
  }

  /** Détail complet d'une admission (incluant tous les piliers) */
  getApplicationById(id: string): Observable<Admission> {
    return this.http.get<Admission>(`${this.baseUrl}/admissions/${id}/details`, {headers: this.getHeaders()}).pipe(
      catchError(this.handleError('Impossible de récupérer le dossier'))
    );
  }

  /**
   * Saisie directe au guichet (Secretariat V3)
   */
  createDirectApplication(request: FastEntryRequest): Observable<Admission> {
    return this.http.post<Admission>(`${this.baseUrl}/admissions/direct`, request, {headers: this.getHeaders()}).pipe(
      catchError(this.handleError('Erreur lors de la création du dossier direct'))
    );
  }

  // --- CONFIGURATION CMS DU PORTAIL ---

  /**
   * Récupérer la structure complète du formulaire (Piliers & Champs)
   */
  getConfig(): Observable<EnrollmentConfig> {
    return this.http.get<EnrollmentConfig>(`${this.baseUrl}/config`, {headers: this.getHeaders()}).pipe(
      catchError(this.handleError('Impossible de charger la configuration du portail'))
    );
  }

  /**
   * Mettre à jour l'intégralité du CMS
   */
  updateConfig(config: EnrollmentConfig): Observable<EnrollmentConfig> {
    return this.http.put<EnrollmentConfig>(`${this.baseUrl}/config`, config, {headers: this.getHeaders()}).pipe(
      catchError(this.handleError('Erreur lors de la mise à jour de la configuration'))
    );
  }

  /**
   * Réinitialiser la configuration aux standards système Feewi
   */
  resetConfig(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/config/reset`, {}, {headers: this.getHeaders()}).pipe(
      catchError(this.handleError('Erreur lors de la réinitialisation de la configuration'))
    );
  }

  /** Gérer le Master Switch du portail parent */
  updatePortalStatus(active: boolean): Observable<void> {
    const params = new HttpParams().set('active', active.toString());
    return this.http.patch<void>(`${this.baseUrl}/config/portal-status`, {}, {params, headers: this.getHeaders()}).pipe(
      catchError(this.handleError('Erreur lors du changement de statut du portail'))
    );
  }

  /**
   * Appliquer des exceptions par niveau (Quotas, fermeture spécifique)
   */
  updateLevelOverride(levelId: string, override: LevelOverrideConfig): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/config/level-overrides/${levelId}`, override, {headers: this.getHeaders()}).pipe(
      catchError(this.handleError('Erreur lors de la personnalisation du niveau'))
    );
  }

  /**
   * Récupère la fusion Global + Surcharges pour un niveau
   */
  getEffectiveConfig(levelId: string): Observable<EffectiveConfigResponse> {
    const url = `${this.envService.getServiceUrl('enrollment')}/public/config/${levelId}`;
    return this.http.get<EffectiveConfigResponse>(url, {headers: this.getHeaders()}).pipe(
      catchError(this.handleError('Impossible de charger la configuration effective du niveau'))
    );
  }

  // --- ACTIONS OPÉRATIONNELLES (WORKFLOW) ---

  receivePhysicalDocument(admissionId: string, docCode: string): Observable<Admission> {
    return this.http.patch<Admission>(
      `${this.baseUrl}/admissions/${admissionId}/documents/${docCode}/receive`,
      {},
      {headers: this.getHeaders()}
    ).pipe(
      catchError(this.handleError('Erreur lors de la validation du document physique'))
    );
  }

  /** Lier un fichier numérisé à un dossier */
  linkDocument(admissionId: string, docCode: string, fileId: string): Observable<Admission> {
    const headers = this.getHeaders().set('Content-Type', 'text/plain');
    const url = `${this.envService.getServiceUrl('enrollment')}/public/admissions/${admissionId}/documents/${docCode}`;
    return this.http.post<Admission>(url, fileId, {headers}).pipe(
      catchError(this.handleError('Erreur lors de la liaison du document numérisé'))
    );
  }

  /** Valider la conformité administrative (Secrétariat) */
  verifyApplication(admissionId: string): Observable<Admission> {
    return this.http.patch<Admission>(`${this.baseUrl}/admissions/${admissionId}/verify`, {}, {headers: this.getHeaders()}).pipe(
      catchError(this.handleError('Erreur lors de la vérification administrative'))
    );
  }

  /** Enregistrer les résultats de l'examen de niveau */
  submitAssessment(admissionId: string, assessment: AssessmentRequest): Observable<Admission> {
    return this.http.patch<Admission>(
      `${this.baseUrl}/admissions/${admissionId}/assessment`,
      assessment,
      {headers: this.getHeaders()}
    ).pipe(
      catchError(this.handleError('Erreur lors de l\'enregistrement de l\'évaluation'))
    );
  }

  // --- API DIRECTION (DÉCISIONS FINALES) ---

  validateAdmission(admissionId: string): Observable<Admission> {
    return this.http.patch<Admission>(`${this.baseUrl}/direction/admissions/${admissionId}/validate`, {}, {headers: this.getHeaders()}).pipe(
      catchError(this.handleError('Erreur lors de la validation finale'))
    );
  }

  overruleAdmission(admissionId: string): Observable<Admission> {
    return this.http.patch<Admission>(`${this.baseUrl}/direction/admissions/${admissionId}/overrule`, {}, {headers: this.getHeaders()}).pipe(
      catchError(this.handleError('Erreur lors de la validation avec dérogation'))
    );
  }

  rejectAdmission(admissionId: string, reason: string): Observable<Admission> {
    return this.http.patch<Admission>(
      `${this.baseUrl}/direction/admissions/${admissionId}/reject`,
      JSON.stringify(reason),
      {headers: this.getHeaders().set('Content-Type', 'application/json')}
    ).pipe(
      catchError(this.handleError('Erreur lors du rejet du dossier'))
    );
  }
}
