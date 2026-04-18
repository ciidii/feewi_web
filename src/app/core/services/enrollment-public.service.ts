import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

import {
  AdmissionBundleResponse,
  AddChildRequest,
  AssessmentRequest,
  CreateBundleRequest,
  DefaultConfigResponse,
  LevelConfigResponse,
  PublicPortalSummary,
  ReEnrollRequest,
  ServiceSubscriptionRequest,
} from '../models/enrollment/dtos';
import { Admission } from '../models/enrollment/entities';

import { TenantContextService } from './tenant-context.service';
import { EnvironmentService } from './environment.service';
import { NotificationService } from '../../shared/services/notification.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';

@Injectable({ providedIn: 'root' })
export class EnrollmentPublicService {
  private http = inject(HttpClient);
  private tenantContext = inject(TenantContextService);
  private envService = inject(EnvironmentService);
  private notificationService = inject(NotificationService);

  private get base(): string {
    return this.envService.getServiceUrl('enrollment');
  }

  private getHeaders(): HttpHeaders {
    const tenantId = this.tenantContext.activeTenant()?.id;
    let headers = new HttpHeaders();
    if (tenantId) headers = headers.set('X-Tenant-Id', tenantId);
    return headers;
  }

  private handleError(message: string) {
    return (error: any) => {
      console.error(error);
      this.notificationService.error(error?.error?.message || message);
      return throwError(() => error);
    };
  }

  private getUrl(path: string): string {
    return `${this.base}${path}`;
  }

  // --- CONFIG PORTAIL ---

  getPortalSummary(): Observable<PublicPortalSummary> {
    return this.http
      .get<PublicPortalSummary>(this.getUrl(API_ENDPOINTS.ENROLLMENT.PUBLIC.SUMMARY), { headers: this.getHeaders() })
      .pipe(catchError(this.handleError('Impossible de charger le portail')));
  }

  getPortalSummaryForTenant(tenantId: string): Observable<PublicPortalSummary> {
    const headers = new HttpHeaders().set('X-Tenant-Id', tenantId);
    return this.http
      .get<PublicPortalSummary>(this.getUrl(API_ENDPOINTS.ENROLLMENT.PUBLIC.SUMMARY), { headers })
      .pipe(catchError(this.handleError('Impossible de charger le portail')));
  }

  getDefaultConfig(): Observable<DefaultConfigResponse> {
    return this.http
      .get<DefaultConfigResponse>(this.getUrl(API_ENDPOINTS.ENROLLMENT.PUBLIC.DEFAULT_CONFIG), { headers: this.getHeaders() })
      .pipe(catchError(this.handleError('Impossible de charger la configuration')));
  }

  getLevelConfig(levelId: string): Observable<LevelConfigResponse> {
    return this.http
      .get<LevelConfigResponse>(this.getUrl(API_ENDPOINTS.ENROLLMENT.PUBLIC.EFFECTIVE_CONFIG(levelId)), { headers: this.getHeaders() })
      .pipe(catchError(this.handleError('Impossible de charger la config du niveau')));
  }

  // --- WORKFLOW BUNDLE ---

  /** ÉTAPE 1 — Initialise le dossier familial (bundle) */
  createBundle(request: CreateBundleRequest): Observable<AdmissionBundleResponse> {
    return this.http
      .post<AdmissionBundleResponse>(this.getUrl(API_ENDPOINTS.ENROLLMENT.PUBLIC.CREATE_BUNDLE), request, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError('Erreur lors de la création du dossier')));
  }

  /** Récupère un bundle sécurisé (session recovery) */
  getBundle(bundleId: string, accessCode: string): Observable<AdmissionBundleResponse> {
    const params = new HttpParams().set('accessCode', accessCode);
    return this.http
      .get<AdmissionBundleResponse>(this.getUrl(API_ENDPOINTS.ENROLLMENT.PUBLIC.GET_BUNDLE(bundleId)), { headers: this.getHeaders(), params })
      .pipe(catchError(this.handleError('Dossier introuvable')));
  }

  /** Récupère un bundle via sa référence publique (session recovery) */
  getBundleByRef(reference: string, accessCode: string): Observable<AdmissionBundleResponse> {
    const params = new HttpParams().set('accessCode', accessCode);
    return this.http
      .get<AdmissionBundleResponse>(this.getUrl(API_ENDPOINTS.ENROLLMENT.PUBLIC.GET_BUNDLE_BY_REF(reference)), { headers: this.getHeaders(), params })
      .pipe(catchError(this.handleError('Dossier introuvable ou codes incorrects')));
  }

  /** ÉTAPE 2 — Ajoute un enfant au bundle */
  addChild(bundleId: string, request: AddChildRequest): Observable<Admission> {
    return this.http
      .post<Admission>(this.getUrl(API_ENDPOINTS.ENROLLMENT.PUBLIC.ADD_CHILD(bundleId)), request, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError('Erreur lors de l\'ajout de l\'enfant')));
  }

  /** ÉTAPE 3 — Met à jour un pilier de l'admission (ex: identity, medical) */
  updateChildPillar(admissionId: string, pillarKey: string, data: any): Observable<void> {
    return this.http
      .patch<void>(this.getUrl(API_ENDPOINTS.ENROLLMENT.PUBLIC.UPDATE_PILLAR(admissionId, pillarKey)), data, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError(`Erreur sur le pilier ${pillarKey}`)));
  }

  /** ÉTAPE 4 — Met à jour un pilier du bundle (ex: pillar_family) */
  updateFamilyPillar(bundleId: string, data: any): Observable<void> {
    return this.http
      .patch<void>(this.getUrl(API_ENDPOINTS.ENROLLMENT.PUBLIC.UPDATE_BUNDLE_PILLAR(bundleId, 'pillar_family')), data, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError('Erreur sur le volet famille')));
  }

  /** Services — Souscriptions cantine/transport */
  subscribeServices(admissionId: string, subscriptions: ServiceSubscriptionRequest[]): Observable<void> {
    return this.http
      .patch<void>(this.getUrl(API_ENDPOINTS.ENROLLMENT.PUBLIC.SUBSCRIPTIONS(admissionId)), subscriptions, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError('Erreur lors de la sélection des services')));
  }

  /** Documents — Upload URL brute (string) */
  uploadDocument(admissionId: string, docCode: string, fileUrl: string): Observable<void> {
    const headers = this.getHeaders().set('Content-Type', 'text/plain');
    return this.http
      .post<void>(this.getUrl(API_ENDPOINTS.ENROLLMENT.PUBLIC.DOCUMENTS(admissionId, docCode)), fileUrl, { headers })
      .pipe(catchError(this.handleError('Erreur lors de l\'envoi du document')));
  }

  /** Soumet une admission individuelle */
  submitAdmission(admissionId: string): Observable<Admission> {
    return this.http
      .post<Admission>(this.getUrl(API_ENDPOINTS.ENROLLMENT.PUBLIC.SUBMIT_ADMISSION(admissionId)), null, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError('Erreur lors de la soumission')));
  }

  /** ÉTAPE 5 — Soumet l'intégralité du bundle familial */
  submitBundle(bundleId: string): Observable<AdmissionBundleResponse> {
    return this.http
      .post<AdmissionBundleResponse>(this.getUrl(API_ENDPOINTS.ENROLLMENT.PUBLIC.SUBMIT_BUNDLE(bundleId)), null, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError('Erreur lors de la soumission du bundle')));
  }

  // --- SUIVI & DIVERS ---

  /** Suivi du statut par référence */
  trackAdmission(reference: string, accessCode: string): Observable<Admission> {
    const params = new HttpParams().set('accessCode', accessCode);
    return this.http
      .get<Admission>(this.getUrl(API_ENDPOINTS.ENROLLMENT.PUBLIC.TRACK(reference)), { headers: this.getHeaders(), params })
      .pipe(catchError(this.handleError('Suivi introuvable')));
  }

  /** Liste les admissions liées à un email */
  getMyAdmissions(email: string): Observable<Admission[]> {
    const params = new HttpParams().set('email', email);
    return this.http
      .get<Admission[]>(this.getUrl(API_ENDPOINTS.ENROLLMENT.PUBLIC.MINE), { headers: this.getHeaders(), params })
      .pipe(catchError(this.handleError('Erreur lors du chargement de vos dossiers')));
  }

  /** Annule une admission */
  cancelAdmission(admissionId: string): Observable<void> {
    return this.http
      .post<void>(this.getUrl(API_ENDPOINTS.ENROLLMENT.PUBLIC.CANCEL(admissionId)), null, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError('Erreur lors de l\'annulation')));
  }

  /** Confirmation bundle par le parent : ADMITTED → paiement déclenché (PAYMENT_REQUIRED ou PARENT_CHOICE) */
  confirmAdmitted(bundleId: string, accessCode: string): Observable<AdmissionBundleResponse> {
    return this.http
      .post<AdmissionBundleResponse>(this.getUrl(API_ENDPOINTS.ENROLLMENT.PUBLIC.CONFIRM_ADMITTED(bundleId)), { accessCode }, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError('Erreur lors de la confirmation')));
  }

  /** Annulation de tous les enfants admis du bundle (PARENT_CHOICE → CLOSED) */
  cancelAll(bundleId: string, accessCode: string): Observable<AdmissionBundleResponse> {
    return this.http
      .post<AdmissionBundleResponse>(this.getUrl(API_ENDPOINTS.ENROLLMENT.PUBLIC.CANCEL_ALL(bundleId)), { accessCode }, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError('Erreur lors de l\'annulation')));
  }

  /** Réinscription élève existant */
  reEnroll(request: ReEnrollRequest): Observable<Admission> {
    return this.http
      .post<Admission>(this.getUrl(API_ENDPOINTS.ENROLLMENT.PUBLIC.RE_ENROLL), request, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError('Erreur lors de la réinscription')));
  }
}
