import {inject, Injectable, signal} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {catchError, finalize, Observable, tap, throwError} from 'rxjs';
import {StudentResponse, StudentStatus, StudentSummary, UpdateStudentRequest} from '../models/student.model';
import {Page} from '../models/school.model';
import {EnvironmentService} from './environment.service';
import {NotificationService} from '../../shared/services/notification.service';

@Injectable({
  providedIn: 'root',
})
export class StudentRegistryService {
  private http = inject(HttpClient);
  private envService = inject(EnvironmentService);
  private notificationService = inject(NotificationService);

  private readonly API_URL = `${this.envService.getServiceUrl('student')}/students`;

  // State
  private _studentsPage = signal<Page<StudentSummary> | null>(null);
  readonly studentsPage = this._studentsPage.asReadonly();

  private _loading = signal<boolean>(false);
  readonly loading = this._loading.asReadonly();

  private handleError(message: string) {
    return (error: any) => {
      console.error(error);
      const errorMessage = error?.error?.message || message;
      this.notificationService.error(errorMessage);
      return throwError(() => error);
    };
  }

  /**
   * Lister et Rechercher des élèves (Paginé)
   */
  getStudents(
    query: string = '',
    status?: StudentStatus,
    classId?: string,
    page: number = 0,
    size: number = 20
  ): Observable<Page<StudentSummary>> {
    this._loading.set(true);
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (query) params = params.set('q', query);
    if (status) params = params.set('status', status);
    if (classId) params = params.set('classId', classId);

    return this.http.get<Page<StudentSummary>>(this.API_URL, { params }).pipe(
      tap(response => this._studentsPage.set(response)),
      catchError(this.handleError('Erreur lors du chargement des élèves')),
      finalize(() => this._loading.set(false))
    );
  }

  /**
   * Dossier complet (360°)
   */
  getStudentById(id: string): Observable<StudentResponse> {
    this._loading.set(true);
    return this.http.get<StudentResponse>(`${this.API_URL}/${id}`).pipe(
      catchError(this.handleError('Impossible de charger le dossier de l\'élève')),
      finalize(() => this._loading.set(false))
    );
  }

  /**
   * Mise à jour du profil
   */
  updateStudent(id: string, request: UpdateStudentRequest): Observable<StudentResponse> {
    this._loading.set(true);
    return this.http.patch<StudentResponse>(`${this.API_URL}/${id}`, request).pipe(
      tap(() => this.notificationService.success('Dossier élève mis à jour')),
      catchError(this.handleError('Erreur lors de la mise à jour du dossier')),
      finalize(() => this._loading.set(false))
    );
  }

  /**
   * Archive le dossier scolaire (élève au statut LEFT uniquement)
   */
  archiveStudent(id: string): Observable<void> {
    this._loading.set(true);
    return this.http.patch<void>(`${this.API_URL}/${id}/archive`, {}).pipe(
      tap(() => this.notificationService.success('Dossier élève archivé')),
      catchError(this.handleError('Erreur lors de l\'archivage du dossier')),
      finalize(() => this._loading.set(false))
    );
  }
}
