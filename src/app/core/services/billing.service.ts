import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {catchError, Observable, throwError} from 'rxjs';
import {EnvironmentService} from './environment.service';
import {NotificationService} from '../../shared/services/notification.service';
import {TenantContextService} from './tenant-context.service';
import {API_ENDPOINTS} from '../constants/api-endpoints';
import {
  CreateFeeItemRequest,
  CreateFeeTypeRequest,
  FeeItem,
  FeeType,
  Payment,
  RecordPaymentRequest,
  StudentStatement,
  UpdateFeeTypeRequest,
} from '../models/billing.model';

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private http = inject(HttpClient);
  private envService = inject(EnvironmentService);
  private notificationService = inject(NotificationService);
  private tenantContext = inject(TenantContextService);

  private get base(): string {
    return this.envService.getServiceUrl('billing');
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

  // --- RELEVÉ ÉLÈVE ---

  /** Relevé de compte d'un élève (solde détaillé + historique paiements) — consultation RBAC. */
  getStudentStatement(studentId: string): Observable<StudentStatement> {
    return this.http.get<StudentStatement>(this.getUrl(API_ENDPOINTS.BILLING.STATEMENT(studentId)), {
      headers: this.getHeaders(true)
    }).pipe(
      catchError(this.handleError('Impossible de charger le relevé financier'))
    );
  }

  // --- CATALOGUE DE FRAIS ---

  getFeeTypes(includeInactive = false): Observable<FeeType[]> {
    const params = new HttpParams().set('includeInactive', includeInactive.toString());
    return this.http.get<FeeType[]>(this.getUrl(API_ENDPOINTS.BILLING.FEE_TYPES), {
      params,
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError('Impossible de charger le catalogue des frais'))
    );
  }

  createFeeType(request: CreateFeeTypeRequest): Observable<FeeType> {
    return this.http.post<FeeType>(this.getUrl(API_ENDPOINTS.BILLING.FEE_TYPES), request, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError('Erreur lors de la création du type de frais'))
    );
  }

  updateFeeType(id: string, request: UpdateFeeTypeRequest): Observable<FeeType> {
    return this.http.put<FeeType>(this.getUrl(API_ENDPOINTS.BILLING.FEE_TYPE(id)), request, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError('Erreur lors de la mise à jour du type de frais'))
    );
  }

  deleteFeeType(id: string): Observable<void> {
    return this.http.delete<void>(this.getUrl(API_ENDPOINTS.BILLING.FEE_TYPE(id)), {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError('Erreur lors de la suppression du type de frais'))
    );
  }

  // --- MONTANTS DUS & PAIEMENTS ---

  createFeeItem(studentId: string, request: CreateFeeItemRequest): Observable<FeeItem> {
    return this.http.post<FeeItem>(this.getUrl(API_ENDPOINTS.BILLING.FEE_ITEMS(studentId)), request, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError('Erreur lors de l\'enregistrement du montant dû'))
    );
  }

  recordPayment(studentId: string, request: RecordPaymentRequest): Observable<Payment> {
    return this.http.post<Payment>(this.getUrl(API_ENDPOINTS.BILLING.PAYMENTS(studentId)), request, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError('Erreur lors de l\'enregistrement du paiement'))
    );
  }
}
