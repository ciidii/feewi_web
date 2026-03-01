import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { School, Page } from '../models/school.model';

@Injectable({
  providedIn: 'root',
})
export class SchoolService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8080/api/v1/schools';

  // État global pour les écoles (Signals)
  private _schoolsPage = signal<Page<School> | null>(null);
  readonly schoolsPage = this._schoolsPage.asReadonly();

  private _loading = signal<boolean>(false);
  readonly loading = this._loading.asReadonly();

  /**
   * Liste les écoles avec pagination et recherche
   */
  async getSchools(search: string = '', page: number = 0, size: number = 10): Promise<void> {
    this._loading.set(true);
    try {
      const params = new HttpParams()
        .set('search', search)
        .set('page', page.toString())
        .set('size', size.toString());

      const response = await firstValueFrom(
        this.http.get<Page<School>>(this.API_URL, { params })
      );
      this._schoolsPage.set(response);
    } catch (error) {
      console.error('Failed to fetch schools', error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Récupère les détails d'une école par son ID
   */
  async getSchoolById(id: string): Promise<School> {
    return await firstValueFrom(this.http.get<School>(`${this.API_URL}/${id}`));
  }

  /**
   * Provisionne une nouvelle école (SaaS Admin)
   */
  async createSchool(school: School): Promise<School> {
    this._loading.set(true);
    try {
      return await firstValueFrom(this.http.post<School>(this.API_URL, school));
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Met à jour les informations d'une école
   */
  async updateSchool(id: string, school: Partial<School>): Promise<School> {
    this._loading.set(true);
    try {
      return await firstValueFrom(this.http.put<School>(`${this.API_URL}/${id}`, school));
    } finally {
      this._loading.set(false);
    }
  }
}
