import {HttpClient, HttpHeaders, HttpParams} from "@angular/common/http";
import {inject, Injectable} from "@angular/core";
import {EnvironmentService} from "./environment.service";
import {NotificationService} from "../../shared/services/notification.service";
import {TenantContextService} from "./tenant-context.service";
import {catchError, Observable, of, throwError} from "rxjs";
import {API_ENDPOINTS} from "../constants/api-endpoints";
import {
  Admission,
  AdmissionPageResponse,
  AdmissionStatus,
  AssessmentRequest,
  CycleOverrideConfig,
  CycleType,
  DirectEntryRequest,
  EnrollmentConfig,
  LevelConfigResponse,
  LevelOverrideConfig,
  YearOverrideConfig,
  EnrollmentDashboardStats
} from '../models/enrollment.model';

@Injectable({
  providedIn: 'root'
})
export class EnrollmentAdminService {
  private http = inject(HttpClient);
  private envService = inject(EnvironmentService);
  private notificationService = inject(NotificationService);
  private tenantContext = inject(TenantContextService);

  private get base(): string {
    return this.envService.getServiceUrl('enrollment');
  }

  private getUrl(path: string): string {
    return `${this.base}${path}`;
  }

  private getHeaders(skipLoader = false): HttpHeaders {
    const tenantId = this.tenantContext.activeTenant()?.id || 'default';
    let headers = new HttpHeaders().set('X-Tenant-Id', tenantId);
    if (skipLoader) {
      headers = headers.set('x-skip-loader', 'true');
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

  // --- DASHBOARD & STATS ---

  /** Statistiques consolidées pour le Dashboard (Direction/Secrétariat) */
  getDashboardStats(academicYearId?: string): Observable<EnrollmentDashboardStats> {
    let params = new HttpParams();
    if (academicYearId) params = params.set('academicYearId', academicYearId);

    return this.http.get<EnrollmentDashboardStats>(this.getUrl(API_ENDPOINTS.ENROLLMENT.ADMIN.DASHBOARD_STATS), {
      params,
      headers: this.getHeaders()
    }).pipe(
      catchError(() => {
        console.warn('[EnrollmentService] Dashboard API not ready, using MOCK data');
        return of(this.getMockDashboardData());
      })
    );
  }

  private getMockDashboardData(): EnrollmentDashboardStats {
    return {
      metrics: {
        totalApplications: 156,
        newApplications: 92,
        reEnrollments: 64,
        conversionRate: 42.3,
        growthTrend: 15
      },
      operational: {
        pendingVerification: 24,
        pendingEvaluation: 12,
        pendingDecision: 8,
        incompleteDossiers: 6
      },
      pipeline: {
        submitted: 60,
        verified: 45,
        testing: 30,
        validated: 21
      },
      capacity: {
        saturatedLevelsCount: 3,
        levels: [
          { id: '1', name: 'Terminales S', totalApplications: 45, validated: 38, totalCapacity: 40, occupancyRate: 95, isSaturated: true },
          { id: '2', name: '6ème Fondamental', totalApplications: 80, validated: 72, totalCapacity: 80, occupancyRate: 90, isSaturated: true },
          { id: '3', name: 'CP1', totalApplications: 30, validated: 28, totalCapacity: 30, occupancyRate: 93, isSaturated: true },
          { id: '4', name: 'Maternelle GS', totalApplications: 25, validated: 15, totalCapacity: 30, occupancyRate: 60, isSaturated: false }
        ]
      },
      upcomingMilestones: [
        { label: 'Commission Pédagogique #4', date: '2026-06-15T14:00:00Z', location: 'Salle de réunion A' },
        { label: 'Clôture Inscriptions Portail', date: '2026-06-30T23:59:59Z' }
      ]
    };
  }

  // --- GESTION DES DOSSIERS ---

  /** Liste & Recherche Paginée */
  getApplications(params: {
    q?: string,
    status?: AdmissionStatus,
    levelId?: string,
    academicYearId?: string,
    channel?: 'DIGITAL' | 'DIRECT',
    incompleteOnly?: boolean,
    page?: number,
    size?: number
  } = {}): Observable<AdmissionPageResponse> {
    let httpParams = new HttpParams();
    if (params.q) httpParams = httpParams.set('q', params.q);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.levelId) httpParams = httpParams.set('levelId', params.levelId);
    if (params.academicYearId) httpParams = httpParams.set('academicYearId', params.academicYearId);
    if (params.channel) httpParams = httpParams.set('channel', params.channel);
    if (params.incompleteOnly) httpParams = httpParams.set('incompleteOnly', 'true');
    if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params.size !== undefined) httpParams = httpParams.set('size', params.size.toString());

    return this.http.get<AdmissionPageResponse>(this.getUrl(API_ENDPOINTS.ENROLLMENT.ADMIN.ADMISSIONS), {
      params: httpParams,
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError('Erreur lors du chargement des dossiers'))
    );
  }

  /** Détail complet d'une admission */
  getApplicationById(id: string): Observable<Admission> {
    return this.http.get<Admission>(this.getUrl(API_ENDPOINTS.ENROLLMENT.ADMIN.ADMISSION_DETAILS(id)), { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Impossible de récupérer le dossier'))
    );
  }

  /** Saisie directe au guichet (Secretariat) */
  createDirectApplication(request: DirectEntryRequest): Observable<Admission> {
    return this.http.post<Admission>(this.getUrl(API_ENDPOINTS.ENROLLMENT.ADMIN.DIRECT_ENTRY), request, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors de la création du dossier direct'))
    );
  }

  /** Annuler une admission (Admin) */
  cancelAdmission(admissionId: string): Observable<void> {
    return this.http.post<void>(this.getUrl(API_ENDPOINTS.ENROLLMENT.ADMIN.CANCEL(admissionId)), null, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors de l\'annulation'))
    );
  }

  /** Confirmer le paiement (garde-fou minimal, précondition à la validation) */
  confirmPayment(admissionId: string): Observable<void> {
    return this.http.patch<void>(this.getUrl(API_ENDPOINTS.ENROLLMENT.ADMIN.CONFIRM_PAYMENT(admissionId)), {}, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors de la confirmation du paiement'))
    );
  }

  // --- CONFIGURATION CMS DU PORTAIL ---

  getConfig(): Observable<EnrollmentConfig> {
    return this.http.get<EnrollmentConfig>(this.getUrl(API_ENDPOINTS.ENROLLMENT.ADMIN.CONFIG), { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Impossible de charger la configuration du portail'))
    );
  }

  updateConfig(config: EnrollmentConfig): Observable<EnrollmentConfig> {
    return this.http.put<EnrollmentConfig>(this.getUrl(API_ENDPOINTS.ENROLLMENT.ADMIN.CONFIG), config, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors de la mise à jour de la configuration'))
    );
  }

  resetConfig(): Observable<void> {
    return this.http.post<void>(this.getUrl(API_ENDPOINTS.ENROLLMENT.ADMIN.CONFIG_RESET), {}, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors de la réinitialisation de la configuration'))
    );
  }

  updatePortalStatus(active: boolean): Observable<void> {
    const params = new HttpParams().set('active', active.toString());
    return this.http.patch<void>(this.getUrl(API_ENDPOINTS.ENROLLMENT.ADMIN.PORTAL_STATUS), {}, { params, headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors du changement de statut du portail'))
    );
  }

  updateLevelOverride(levelId: string, override: LevelOverrideConfig): Observable<void> {
    return this.http.patch<void>(this.getUrl(API_ENDPOINTS.ENROLLMENT.ADMIN.LEVEL_OVERRIDE(levelId)), override, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors de la personnalisation du niveau'))
    );
  }

  deleteLevelOverride(levelId: string): Observable<void> {
    return this.http.delete<void>(this.getUrl(API_ENDPOINTS.ENROLLMENT.ADMIN.LEVEL_OVERRIDE(levelId)), { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors de la suppression de l\'override de niveau'))
    );
  }

  getEffectiveConfig(levelId: string): Observable<LevelConfigResponse> {
    return this.http.get<LevelConfigResponse>(this.getUrl(API_ENDPOINTS.ENROLLMENT.PUBLIC.EFFECTIVE_CONFIG(levelId)), { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Impossible de charger la configuration effective du niveau'))
    );
  }

  updateYearOverride(yearId: string, override: YearOverrideConfig): Observable<void> {
    return this.http.put<void>(this.getUrl(API_ENDPOINTS.ENROLLMENT.ADMIN.YEAR_OVERRIDE(yearId)), override, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors de la configuration de l\'année'))
    );
  }

  deleteYearOverride(yearId: string): Observable<void> {
    return this.http.delete<void>(this.getUrl(API_ENDPOINTS.ENROLLMENT.ADMIN.YEAR_OVERRIDE(yearId)), { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors de la suppression de l\'override d\'année'))
    );
  }

  updateCycleOverride(cycleType: CycleType, override: CycleOverrideConfig): Observable<void> {
    return this.http.put<void>(this.getUrl(API_ENDPOINTS.ENROLLMENT.ADMIN.CYCLE_OVERRIDE(cycleType)), override, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors de la configuration du cycle'))
    );
  }

  deleteCycleOverride(cycleType: CycleType): Observable<void> {
    return this.http.delete<void>(this.getUrl(API_ENDPOINTS.ENROLLMENT.ADMIN.CYCLE_OVERRIDE(cycleType)), { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors de la suppression de l\'override de cycle'))
    );
  }

  // --- ACTIONS OPÉRATIONNELLES ---

  receivePhysicalDocument(admissionId: string, docCode: string): Observable<Admission> {
    return this.http.patch<Admission>(
      this.getUrl(API_ENDPOINTS.ENROLLMENT.ADMIN.RECEIVE_DOCUMENT(admissionId, docCode)),
      {},
      { headers: this.getHeaders(true) }
    ).pipe(
      catchError(this.handleError('Erreur lors de la validation du document physique'))
    );
  }

  /** Lier un fichier numérisé à un dossier (Admin) */
  linkDocument(admissionId: string, docCode: string, fileId: string): Observable<Admission> {
    const headers = this.getHeaders(true).set('Content-Type', 'text/plain');
    return this.http.post<Admission>(this.getUrl(API_ENDPOINTS.ENROLLMENT.PUBLIC.DOCUMENTS(admissionId, docCode)), fileId, { headers }).pipe(
      catchError(this.handleError('Erreur lors de la liaison du document numérisé'))
    );
  }

  verifyApplication(admissionId: string): Observable<Admission> {
    return this.http.patch<Admission>(this.getUrl(API_ENDPOINTS.ENROLLMENT.ADMIN.VERIFY(admissionId)), {}, { headers: this.getHeaders(true) }).pipe(
      catchError(this.handleError('Erreur lors de la vérification administrative'))
    );
  }

  submitAssessment(admissionId: string, assessment: AssessmentRequest): Observable<Admission> {
    return this.http.patch<Admission>(
      this.getUrl(API_ENDPOINTS.ENROLLMENT.ADMIN.ASSESSMENT(admissionId)),
      assessment,
      { headers: this.getHeaders(true) }
    ).pipe(
      catchError(this.handleError('Erreur lors de l\'enregistrement de l\'évaluation'))
    );
  }

  // --- API DIRECTION ---

  admitAdmission(admissionId: string): Observable<Admission> {
    return this.http.patch<Admission>(this.getUrl(API_ENDPOINTS.ENROLLMENT.ADMIN.ADMIT(admissionId)), {}, { headers: this.getHeaders(true) }).pipe(
      catchError(this.handleError('Erreur lors de l\'admission manuelle'))
    );
  }

  validateAdmission(admissionId: string): Observable<Admission> {
    return this.http.patch<Admission>(this.getUrl(API_ENDPOINTS.ENROLLMENT.ADMIN.VALIDATE(admissionId)), {}, { headers: this.getHeaders(true) }).pipe(
      catchError(this.handleError('Erreur lors de la validation finale'))
    );
  }

  overruleAdmission(admissionId: string): Observable<Admission> {
    return this.http.patch<Admission>(this.getUrl(API_ENDPOINTS.ENROLLMENT.ADMIN.OVERRULE(admissionId)), {}, { headers: this.getHeaders(true) }).pipe(
      catchError(this.handleError('Erreur lors de la validation avec dérogation'))
    );
  }

  rejectAdmission(admissionId: string, reason: string): Observable<Admission> {
    return this.http.patch<Admission>(
      this.getUrl(API_ENDPOINTS.ENROLLMENT.ADMIN.REJECT(admissionId)),
      JSON.stringify(reason),
      { headers: this.getHeaders(true).set('Content-Type', 'application/json') }
    ).pipe(
      catchError(this.handleError('Erreur lors du rejet du dossier'))
    );
  }

  waitlistAdmission(admissionId: string): Observable<void> {
    return this.http.patch<void>(this.getUrl(API_ENDPOINTS.ENROLLMENT.ADMIN.WAITLIST(admissionId)), {}, { headers: this.getHeaders(true) }).pipe(
      catchError(this.handleError('Erreur lors du passage en liste d\'attente'))
    );
  }

  bulkValidate(admissionIds: string[]): Observable<Admission[]> {
    return this.http.post<Admission[]>(this.getUrl(API_ENDPOINTS.ENROLLMENT.ADMIN.BULK_VALIDATE), admissionIds, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors de la validation en masse'))
    );
  }
}
