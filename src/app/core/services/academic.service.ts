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

  async getYearById(id: string): Promise<AcademicYear> {
    return await firstValueFrom(this.http.get<AcademicYear>(`${this.API_URL}/years/${id}`));
  }

  async getCurrentYear(): Promise<AcademicYear> {
    return await firstValueFrom(this.http.get<AcademicYear>(`${this.API_URL}/years/current`));
  }

  async createYear(request: CreateYearRequest): Promise<AcademicYear> {
    return await firstValueFrom(this.http.post<AcademicYear>(`${this.API_URL}/years`, request));
  }

  // --- Workflow de l'année ---

  async activateYear(id: string): Promise<void> {
    await firstValueFrom(this.http.patch<void>(`${this.API_URL}/years/${id}/activate`, {}));
  }

  async closeYear(id: string): Promise<void> {
    await firstValueFrom(this.http.patch<void>(`${this.API_URL}/years/${id}/close`, {}));
  }

  async reopenYear(id: string): Promise<void> {
    await firstValueFrom(this.http.patch<void>(`${this.API_URL}/years/${id}/reopen`, {}));
  }

  async archiveYear(id: string): Promise<void> {
    await firstValueFrom(this.http.patch<void>(`${this.API_URL}/years/${id}/archive`, {}));
  }

  // ===========================================
  // PÉRIODES & CONGÉS
  // ===========================================

  async getPeriods(yearId: string): Promise<Period[]> {
    return await firstValueFrom(this.http.get<Period[]>(`${this.API_URL}/years/${yearId}/periods`));
  }

  async createPeriod(yearId: string, period: Partial<Period>): Promise<Period> {
    return await firstValueFrom(this.http.post<Period>(`${this.API_URL}/years/${yearId}/periods`, period));
  }

  async updatePeriod(yearId: string, id: string, period: Partial<Period>): Promise<Period> {
    return await firstValueFrom(this.http.put<Period>(`${this.API_URL}/years/${yearId}/periods/${id}`, period));
  }

  async deletePeriod(yearId: string, id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.API_URL}/years/${yearId}/periods/${id}`));
  }

  async getHolidays(yearId: string): Promise<Holiday[]> {
    return await firstValueFrom(this.http.get<Holiday[]>(`${this.API_URL}/years/${yearId}/holidays`));
  }

  async createHoliday(yearId: string, holiday: Partial<Holiday>): Promise<Holiday> {
    return await firstValueFrom(this.http.post<Holiday>(`${this.API_URL}/years/${yearId}/holidays`, holiday));
  }

  async updateHoliday(yearId: string, id: string, holiday: Partial<Holiday>): Promise<Holiday> {
    return await firstValueFrom(this.http.put<Holiday>(`${this.API_URL}/years/${yearId}/holidays/${id}`, holiday));
  }

  async deleteHoliday(yearId: string, id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.API_URL}/years/${yearId}/holidays/${id}`));
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
