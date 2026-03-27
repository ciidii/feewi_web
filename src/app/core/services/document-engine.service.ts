import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpBackend, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { 
  UploadTicketRequest, 
  UploadTicketResponse 
} from '../models/document.model';
import { EnvironmentService } from './environment.service';
import { NotificationService } from '../../shared/services/notification.service';

@Injectable({
  providedIn: 'root'
})
export class DocumentEngineService {
  private http = inject(HttpClient);
  private handler = inject(HttpBackend);
  private envService = inject(EnvironmentService);
  private notificationService = inject(NotificationService);
  
  // Instance HTTP sans intercepteurs pour l'upload direct vers S3/MinIO
  private directHttpClient = new HttpClient(this.handler);

  private readonly baseUrl = this.envService.getServiceUrl('documents');

  private handleError(message: string) {
    return (error: any) => {
      console.error(error);
      this.notificationService.error(message);
      return throwError(() => error);
    };
  }

  /**
   * ÉTAPE 1 : Demander un ticket d'upload au Document Engine
   */
  getUploadTicket(request: UploadTicketRequest): Observable<UploadTicketResponse> {
    return this.http.post<UploadTicketResponse>(`${this.baseUrl}/upload-ticket`, request).pipe(
      catchError(this.handleError('Impossible d\'obtenir un ticket d\'envoi'))
    );
  }

  /**
   * ÉTAPE 2 : Upload direct du binaire vers le stockage (S3/MinIO)
   */
  uploadFileDirectly(uploadUrl: string, file: File): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': file.type
    });

    return this.directHttpClient.put(uploadUrl, file, { headers }).pipe(
      catchError(this.handleError('Échec de l\'envoi du fichier vers le serveur de stockage'))
    );
  }

  /**
   * Obtenir l'URL de visualisation d'un document (URL pré-signée temporaire)
   */
  getViewUrl(fileId: string): Observable<string> {
    return this.http.get(`${this.baseUrl}/${fileId}/view`, { 
      responseType: 'text' 
    }).pipe(
      catchError(this.handleError('Impossible de récupérer l\'aperçu du document'))
    );
  }
}
