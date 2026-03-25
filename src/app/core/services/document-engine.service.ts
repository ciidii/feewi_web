import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpBackend, HttpHeaders } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { 
  UploadTicketRequest, 
  UploadTicketResponse, 
  DocumentViewResponse 
} from '../models/document.model';

@Injectable({
  providedIn: 'root'
})
export class DocumentEngineService {
  private http = inject(HttpClient);
  private handler = inject(HttpBackend);
  
  // Instance HTTP sans intercepteurs pour l'upload direct
  private directHttpClient = new HttpClient(this.handler);

  private readonly baseUrl = 'http://localhost:8080/documents/api/v1/documents';

  /**
   * ÉTAPE 1 : Demander un ticket d'upload au Document Engine
   */
  getUploadTicket(request: UploadTicketRequest): Observable<UploadTicketResponse> {
    return this.http.post<UploadTicketResponse>(`${this.baseUrl}/upload-ticket`, request);
  }

  /**
   * ÉTAPE 2 : Upload direct du binaire vers le stockage (S3/MinIO)
   * On utilise directHttpClient pour éviter d'envoyer le Bearer Token JWT
   */
  async uploadFileDirectly(uploadUrl: string, file: File): Promise<void> {
    const headers = new HttpHeaders({
      'Content-Type': file.type
    });

    await firstValueFrom(
      this.directHttpClient.put(uploadUrl, file, { headers })
    );
  }

  /**
   * Obtenir l'URL de visualisation d'un document (URL pré-signée temporaire)
   */
  getViewUrl(fileId: string): Observable<string> {
    // Le backend retourne souvent une string brute ou un objet JSON
    // Selon la doc, c'est une string dans le corps de réponse
    return this.http.get(`${this.baseUrl}/${fileId}/view`, { responseType: 'text' });
  }
}
