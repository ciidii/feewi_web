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

  // --- CONFIG PORTAIL ---

  getPortalSummary(): Observable<PublicPortalSummary> {
    return this.http
      .get<PublicPortalSummary>(`${this.base}/api/v1/public/config/summary`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError('Impossible de charger le portail')));
  }

  getDefaultConfig(): Observable<DefaultConfigResponse> {
    return this.http
      .get<DefaultConfigResponse>(`${this.base}/api/v1/public/config`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError('Impossible de charger la configuration')));
  }

  getLevelConfig(levelId: string): Observable<LevelConfigResponse> {
    return this.http
      .get<LevelConfigResponse>(`${this.base}/api/v1/public/config/${levelId}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError('Impossible de charger la config du niveau')));
  }

  // --- WORKFLOW BUNDLE ---

  /** ÉTAPE 1 — Crée le dossier familial (sans enfant) */
  createBundle(request: CreateBundleRequest): Observable<AdmissionBundleResponse> {
    return this.http
      .post<AdmissionBundleResponse>(`${this.base}/api/v1/public/admissions/bundles`, request, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError('Erreur lors de la création du dossier')));
  }

  /** ÉTAPE 2 — Ajoute un enfant au bundle */
  addChild(bundleId: string, request: AddChildRequest): Observable<Admission> {
    return this.http
      .post<Admission>(`${this.base}/api/v1/public/admissions/bundles/${bundleId}/children`, request, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError('Erreur lors de l\'ajout de l\'enfant')));
  }

  /** ÉTAPE 3 — Met à jour un pilier enfant (retourne 204) */
  updateChildPillar(admissionId: string, pillarKey: string, data: any): Observable<void> {
    return this.http
      .patch<void>(`${this.base}/api/v1/public/admissions/${admissionId}/pillars/${pillarKey}`, data, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError(`Erreur sur le pilier ${pillarKey}`)));
  }

  /** ÉTAPE 4 — Met à jour le pilier famille du bundle (retourne 204) */
  updateFamilyPillar(bundleId: string, data: any): Observable<void> {
    return this.http
      .patch<void>(`${this.base}/api/v1/public/admissions/bundles/${bundleId}/pillars/pillar_family`, data, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError('Erreur sur le volet famille')));
  }

  /** Services — Souscriptions cantine/transport */
  subscribeServices(admissionId: string, subscriptions: ServiceSubscriptionRequest[]): Observable<void> {
    return this.http
      .patch<void>(`${this.base}/api/v1/public/admissions/${admissionId}/subscriptions`, subscriptions, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError('Erreur lors de la sélection des services')));
  }

  /** Documents — Upload URL brute (string) */
  uploadDocument(admissionId: string, docCode: string, fileUrl: string): Observable<void> {
    const headers = this.getHeaders().set('Content-Type', 'text/plain');
    return this.http
      .post<void>(`${this.base}/api/v1/public/admissions/${admissionId}/documents/${docCode}`, fileUrl, { headers })
      .pipe(catchError(this.handleError('Erreur lors de l\'envoi du document')));
  }

  /** ÉTAPE 5 — Soumet tous les enfants du bundle */
  submitBundle(bundleId: string): Observable<AdmissionBundleResponse> {
    return this.http
      .post<AdmissionBundleResponse>(`${this.base}/api/v1/public/admissions/bundles/${bundleId}/submit`, null, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError('Erreur lors de la soumission')));
  }

  /** Soumettre un seul enfant */
  submitAdmission(admissionId: string): Observable<Admission> {
    return this.http
      .post<Admission>(`${this.base}/api/v1/public/admissions/${admissionId}/submit`, null, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError('Erreur lors de la soumission')));
  }

  // --- SUIVI ---

  /** Récupère le bundle complet (session recovery) */
  getBundle(bundleId: string, accessCode: string): Observable<AdmissionBundleResponse> {
    const params = new HttpParams().set('accessCode', accessCode);
    return this.http
      .get<AdmissionBundleResponse>(`${this.base}/api/v1/public/admissions/bundles/${bundleId}`, { headers: this.getHeaders(), params })
      .pipe(catchError(this.handleError('Dossier introuvable')));
  }

  /** Suivi par référence enfant */
  trackAdmission(reference: string, accessCode: string): Observable<Admission> {
    const params = new HttpParams().set('accessCode', accessCode);
    return this.http
      .get<Admission>(`${this.base}/api/v1/public/admissions/${reference}/track`, { headers: this.getHeaders(), params })
      .pipe(catchError(this.handleError('Suivi introuvable')));
  }

  /** Annuler un dossier */
  cancelAdmission(admissionId: string): Observable<void> {
    return this.http
      .post<void>(`${this.base}/api/v1/public/admissions/${admissionId}/cancel`, null, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError('Erreur lors de l\'annulation')));
  }

  /** Réinscription élève existant */
  reEnroll(request: ReEnrollRequest): Observable<Admission> {
    return this.http
      .post<Admission>(`${this.base}/api/v1/public/admissions/re-enroll`, request, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError('Erreur lors de la réinscription')));
  }
}
