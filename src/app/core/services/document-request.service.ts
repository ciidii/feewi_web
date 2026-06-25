import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {catchError, Observable, tap, throwError} from 'rxjs';
import {DocumentRequest, DocumentRequestStatus, SubmitDocumentRequest} from '../models/document.model';
import {EnvironmentService} from './environment.service';
import {NotificationService} from '../../shared/services/notification.service';

@Injectable({
  providedIn: 'root'
})
export class DocumentRequestService {
  private http = inject(HttpClient);
  private envService = inject(EnvironmentService);
  private notificationService = inject(NotificationService);

  private readonly baseUrl = `${this.envService.getServiceUrl('documents')}/requests`;

  private handleError(message: string) {
    return (error: any) => {
      console.error(error);
      this.notificationService.error(error?.error?.message || message);
      return throwError(() => error);
    };
  }

  submitRequest(request: SubmitDocumentRequest): Observable<DocumentRequest> {
    return this.http.post<DocumentRequest>(this.baseUrl, request).pipe(
      tap(() => this.notificationService.success('Demande de document enregistrée')),
      catchError(this.handleError('Erreur lors de la création de la demande'))
    );
  }

  listRequests(status?: DocumentRequestStatus): Observable<DocumentRequest[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<DocumentRequest[]>(this.baseUrl, {params}).pipe(
      catchError(this.handleError('Erreur lors du chargement des demandes'))
    );
  }

  checkEligibility(id: string, eligible: boolean, reason?: string): Observable<DocumentRequest> {
    return this.http.patch<DocumentRequest>(`${this.baseUrl}/${id}/eligibility`, {eligible, reason}).pipe(
      tap(() => this.notificationService.success('Éligibilité mise à jour')),
      catchError(this.handleError('Erreur lors de la vérification d\'éligibilité'))
    );
  }

  approve(id: string): Observable<DocumentRequest> {
    return this.http.patch<DocumentRequest>(`${this.baseUrl}/${id}/approve`, {}).pipe(
      tap(() => this.notificationService.success('Demande validée')),
      catchError(this.handleError('Erreur lors de la validation'))
    );
  }

  reject(id: string, reason: string): Observable<DocumentRequest> {
    return this.http.patch<DocumentRequest>(`${this.baseUrl}/${id}/reject`, {reason}).pipe(
      tap(() => this.notificationService.success('Demande refusée')),
      catchError(this.handleError('Erreur lors du refus'))
    );
  }
}
