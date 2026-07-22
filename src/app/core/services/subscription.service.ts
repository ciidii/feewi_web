import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {catchError, Observable, throwError} from 'rxjs';
import {EnvironmentService} from './environment.service';
import {NotificationService} from '../../shared/services/notification.service';
import {
  BillingOverview,
  RecordPaymentRequest,
  RelanceItem,
  Subscription,
  SubscriptionPayment
} from '../models/subscription.model';

/**
 * Facturation SaaS (back-office super-admin Feewi).
 * Abonnement par école + tableau de bord facturation.
 * Endpoints identity-service :
 *   GET  /schools/{id}/subscription
 *   POST /schools/{id}/subscription/payments
 *   GET  /saas/billing/overview
 *   GET  /saas/billing/relances
 */
@Injectable({providedIn: 'root'})
export class SubscriptionService {
  private http = inject(HttpClient);
  private envService = inject(EnvironmentService);
  private notificationService = inject(NotificationService);

  private readonly SCHOOL_API_URL = this.envService.getServiceUrl('school');
  private readonly IDENTITY_API_URL = this.envService.getServiceUrl('identity');

  private handleError(message: string) {
    return (error: any) => {
      console.error(error);
      this.notificationService.error(message);
      return throwError(() => error);
    };
  }

  /** Abonnement d'une école (404 si non provisionné). */
  getSubscription(schoolId: string): Observable<Subscription> {
    return this.http.get<Subscription>(`${this.SCHOOL_API_URL}/${schoolId}/subscription`).pipe(
      catchError(this.handleError("Impossible de charger l'abonnement de l'établissement"))
    );
  }

  /** Enregistre un paiement manuel et retourne le reçu. */
  recordPayment(schoolId: string, request: RecordPaymentRequest): Observable<SubscriptionPayment> {
    return this.http.post<SubscriptionPayment>(
      `${this.SCHOOL_API_URL}/${schoolId}/subscription/payments`, request
    ).pipe(
      catchError(this.handleError("L'enregistrement du paiement a échoué"))
    );
  }

  /** Indicateurs de facturation (MRR, répartition par statut). */
  getBillingOverview(): Observable<BillingOverview> {
    return this.http.get<BillingOverview>(`${this.IDENTITY_API_URL}/saas/billing/overview`).pipe(
      catchError(this.handleError('Impossible de charger les indicateurs de facturation'))
    );
  }

  /** Écoles à relancer (impayées / suspendues). */
  getRelances(): Observable<RelanceItem[]> {
    return this.http.get<RelanceItem[]>(`${this.IDENTITY_API_URL}/saas/billing/relances`).pipe(
      catchError(this.handleError('Impossible de charger la liste de relance'))
    );
  }
}
