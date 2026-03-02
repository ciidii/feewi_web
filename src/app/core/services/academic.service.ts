import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { 
  AcademicYear, 
  CreateYearRequest, 
  Period, 
  Holiday, 
  Cycle, 
  Level, 
  ClassInstance 
} from '../models/academic.model';

@Injectable({
  providedIn: 'root'
})
export class AcademicService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8080/api/v1/academic';

  // State
  private _loading = signal<boolean>(false);
  readonly loading = this._loading.asReadonly();

  // ===========================================
  // GESTION DES ANNÉES (TEMPORALITÉ)
  // ===========================================

  async getYears(): Promise<AcademicYear[]> {
    return await firstValueFrom(this.http.get<AcademicYear[]>(`${this.API_URL}/years`));
  }

  async createYear(request: CreateYearRequest): Promise<AcademicYear> {
    return await firstValueFrom(this.http.post<AcademicYear>(`${this.API_URL}/years`, request));
  }

  // ===========================================
  // RÉFÉRENTIEL STRUCTURE (Cycles & Niveaux)
  // ===========================================

  async getCycles(): Promise<Cycle[]> {
    return await firstValueFrom(this.http.get<Cycle[]>(`${this.API_URL}/cycles`));
  }

  async createCycle(cycle: Partial<Cycle>): Promise<Cycle> {
    return await firstValueFrom(this.http.post<Cycle>(`${this.API_URL}/cycles`, cycle));
  }

  async updateCycle(id: string, cycle: Partial<Cycle>): Promise<Cycle> {
    return await firstValueFrom(this.http.put<Cycle>(`${this.API_URL}/cycles/${id}`, cycle));
  }

  async deleteCycle(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.API_URL}/cycles/${id}`));
  }

  async getLevels(): Promise<Level[]> {
    return await firstValueFrom(this.http.get<Level[]>(`${this.API_URL}/levels`));
  }

  async createLevel(level: Partial<Level>): Promise<Level> {
    return await firstValueFrom(this.http.post<Level>(`${this.API_URL}/levels`, level));
  }

  async updateLevel(id: string, level: Partial<Level>): Promise<Level> {
    return await firstValueFrom(this.http.put<Level>(`${this.API_URL}/levels/${id}`, level));
  }

  async deleteLevel(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.API_URL}/levels/${id}`));
  }
}
