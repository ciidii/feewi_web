import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { 
  AcademicYear, 
  CreateYearRequest, 
  Period, 
  Holiday, 
  Cycle, 
  Level, 
  SchoolClass,
  Filiere,
  CreateClassRequest,
  Subject,
  CurriculumItem,
  SyllabusDomain,
  Teaching
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
  // GESTION DES CLASSES (OPÉRATIONNEL)
  // ===========================================

  async getClassesByYear(yearId: string): Promise<SchoolClass[]> {
    return await firstValueFrom(this.http.get<SchoolClass[]>(`${this.API_URL}/classes/by-year/${yearId}`));
  }

  async createClass(request: CreateClassRequest): Promise<SchoolClass> {
    return await firstValueFrom(this.http.post<SchoolClass>(`${this.API_URL}/classes`, request));
  }

  async updateClass(id: string, request: Partial<CreateClassRequest>): Promise<SchoolClass> {
    return await firstValueFrom(this.http.put<SchoolClass>(`${this.API_URL}/classes/${id}`, request));
  }

  // ===========================================
  // RÉFÉRENTIEL STRUCTURE (Cycles, Niveaux, Filières)
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

  async getLevels(cycleId?: string): Promise<Level[]> {
    let params = new HttpParams();
    if (cycleId) params = params.set('cycleId', cycleId);
    return await firstValueFrom(this.http.get<Level[]>(`${this.API_URL}/levels`, { params }));
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

  async getFilieres(): Promise<Filiere[]> {
    return await firstValueFrom(this.http.get<Filiere[]>(`${this.API_URL}/filieres`));
  }

  async createFiliere(filiere: Partial<Filiere>): Promise<Filiere> {
    return await firstValueFrom(this.http.post<Filiere>(`${this.API_URL}/filieres`, filiere));
  }

  async deleteFiliere(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.API_URL}/filieres/${id}`));
  }

  // ===========================================
  // GESTION DES MATIÈRES (RÉFÉRENTIEL)
  // ===========================================

  async getSubjects(): Promise<Subject[]> {
    return await firstValueFrom(this.http.get<Subject[]>(`${this.API_URL}/subjects`));
  }

  async createSubject(subject: Partial<Subject>): Promise<Subject> {
    return await firstValueFrom(this.http.post<Subject>(`${this.API_URL}/subjects`, subject));
  }

  async updateSubject(id: string, subject: Partial<Subject>): Promise<Subject> {
    return await firstValueFrom(this.http.put<Subject>(`${this.API_URL}/subjects/${id}`, subject));
  }

  async deleteSubject(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.API_URL}/subjects/${id}`));
  }

  // ===========================================
  // PROGRAMMES (CURRICULUM PER LEVEL)
  // ===========================================

  async getCurriculum(levelId: string, filiereId?: string): Promise<CurriculumItem[]> {
    let params = new HttpParams();
    if (filiereId) params = params.set('filiereId', filiereId);
    
    return await firstValueFrom(this.http.get<CurriculumItem[]>(`${this.API_URL}/curriculum/by-level/${levelId}`, { params }));
  }

  async addSubjectToCurriculum(request: Partial<CurriculumItem>): Promise<CurriculumItem> {
    return await firstValueFrom(this.http.post<CurriculumItem>(`${this.API_URL}/curriculum`, request));
  }

  async updateCurriculumItem(id: string, request: Partial<CurriculumItem>): Promise<CurriculumItem> {
    return await firstValueFrom(this.http.put<CurriculumItem>(`${this.API_URL}/curriculum/${id}`, request));
  }

  async deleteCurriculumItem(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.API_URL}/curriculum/${id}`));
  }

  // ===========================================
  // SYLLABUS (PROGRESSION PÉDAGOGIQUE)
  // ===========================================

  async getSyllabus(curriculumItemId: string): Promise<SyllabusDomain[]> {
    return await firstValueFrom(this.http.get<SyllabusDomain[]>(`${this.API_URL}/curriculum/${curriculumItemId}/syllabus`));
  }

  // ===========================================
  // ENSEIGNEMENTS (TEACHINGS PER CLASS)
  // ===========================================

  /** Lister tous les cours d'une classe (Auto-générés ou Manuels) */
  async getTeachingsByClass(classId: string): Promise<Teaching[]> {
    return await firstValueFrom(this.http.get<Teaching[]>(`${this.API_URL}/classes/${classId}/teachings`));
  }

  /** Approche Hybride : Ajouter un cours manuellement à une classe spécifique */
  async addTeachingToClass(classId: string, request: Partial<Teaching>): Promise<Teaching> {
    return await firstValueFrom(this.http.post<Teaching>(`${this.API_URL}/classes/${classId}/teachings`, request));
  }

  /** Approche V4 : Assigner ou changer un professeur (PATCH granulaire) */
  async assignTeacher(classId: string, teachingId: string, teacherId: string): Promise<Teaching> {
    const params = new HttpParams().set('teacherId', teacherId);
    return await firstValueFrom(
      this.http.patch<Teaching>(`${this.API_URL}/classes/${classId}/teachings/${teachingId}/teacher`, {}, { params })
    );
  }

  /** Retirer un enseignement d'une classe */
  async removeTeachingFromClass(classId: string, teachingId: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.API_URL}/classes/${classId}/teachings/${teachingId}`));
  }
}
