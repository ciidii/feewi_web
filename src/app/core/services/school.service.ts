import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, finalize, map, Observable, tap, throwError } from 'rxjs';
import { School, Page, PublicSchoolResponse } from '../models/school.model';
import { EnvironmentService } from './environment.service';
import { NotificationService } from '../../shared/services/notification.service';

@Injectable({
  providedIn: 'root',
})
export class SchoolService {
  private http = inject(HttpClient);
  private envService = inject(EnvironmentService);
  private notificationService = inject(NotificationService);

  private readonly API_URL = this.envService.getServiceUrl('school');

  // État global pour les écoles (Signals)
  private _schoolsPage = signal<Page<School> | null>(null);
  readonly schoolsPage = this._schoolsPage.asReadonly();

  private _loading = signal<boolean>(false);
  readonly loading = this._loading.asReadonly();

  private handleError(message: string) {
    return (error: any) => {
      console.error(error);
      this.notificationService.error(message);
      return throwError(() => error);
    };
  }

  /**
   * Liste les écoles avec pagination et recherche
   */
  getSchools(search: string = '', page: number = 0, size: number = 10): Observable<Page<School>> {
    this._loading.set(true);
    const params = new HttpParams()
      .set('search', search)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<Page<School>>(this.API_URL, { params }).pipe(
      tap(response => this._schoolsPage.set(response)),
      catchError(this.handleError('Erreur lors du chargement des établissements')),
      finalize(() => this._loading.set(false))
    );
  }

  /**
   * Récupère les détails d'une école par son ID (UUID)
   */
  getSchoolById(id: string): Observable<School> {
    return this.http.get<School>(`${this.API_URL}/${id}`).pipe(
      catchError(this.handleError('Impossible de récupérer les détails de l\'établissement'))
    );
  }

  /**
   * Récupère les informations publiques d'un établissement par son tenantId (Slug)
   * Utilisé pour le branding (logo, nom) au login ou sur le portail public
   */
  getPublicSchoolInfo(tenantId: string): Observable<PublicSchoolResponse> {
    return this.http.get<PublicSchoolResponse>(`${this.API_URL}/public/${tenantId}`).pipe(
      catchError(this.handleError(`Impossible de charger les infos de l'établissement "${tenantId}"`))
    );
  }

  /**
   * Provisionne une nouvelle école (SaaS Admin)
   */
  createSchool(school: any): Observable<School> {
    this._loading.set(true);
    return this.http.post<School>(this.API_URL, school).pipe(
      catchError(this.handleError('Erreur lors de la création de l\'établissement')),
      finalize(() => this._loading.set(false))
    );
  }

  /**
   * Met à jour les informations d'une école
   */
  updateSchool(id: string, school: Partial<School>): Observable<School> {
    this._loading.set(true);
    return this.http.put<School>(`${this.API_URL}/${id}`, school).pipe(
      catchError(this.handleError('Erreur lors de la mise à jour de l\'établissement')),
      finalize(() => this._loading.set(false))
    );
  }
}
