import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {catchError, map, Observable, switchMap, throwError} from 'rxjs';
import {EnvironmentService} from './environment.service';
import {NotificationService} from '../../shared/services/notification.service';
import {TenantContextService} from './tenant-context.service';
import {
  AcademicYear,
  CreateClassRequest,
  CreateYearRequest,
  CurriculumItem,
  Cycle,
  CycleGroup,
  Filiere,
  Holiday,
  Level,
  Period,
  SchoolClass,
  Subject,
  SyllabusDomain,
  Teaching
} from '../models/academic.model';

@Injectable({
  providedIn: 'root'
})
export class AcademicService {
  private http = inject(HttpClient);
  private envService = inject(EnvironmentService);
  private notificationService = inject(NotificationService);
  private tenantContext = inject(TenantContextService);

  private readonly API_URL = this.envService.getServiceUrl('academic');

  // ===========================================
  // HELPERS
  // ===========================================

  private getHeaders(skipLoader = false): HttpHeaders {
    const tenantId = this.tenantContext.activeTenant()?.id || 'default';
    let headers = new HttpHeaders().set('X-Tenant-Id', tenantId);
    if (skipLoader) {
      headers = headers.set('x-skip-loader', 'true');
    }
    return headers;
  }

  private handleError(message: string) {
    return (error: any) => {
      console.error(error);
      this.notificationService.error(message);
      return throwError(() => error);
    };
  }

  // ===========================================
  // GESTION DES ANNÉES (TEMPORALITÉ)
  // ===========================================

  getYears(): Observable<AcademicYear[]> {
    return this.http.get<AcademicYear[]>(`${this.API_URL}/years`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors du chargement des années académiques'))
    );
  }

  getYearById(id: string): Observable<AcademicYear> {
    return this.http.get<AcademicYear>(`${this.API_URL}/years/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors du chargement de l\'année'))
    );
  }

  getCurrentYear(): Observable<AcademicYear> {
    return this.http.get<AcademicYear>(`${this.API_URL}/years/current`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors du chargement de l\'année en cours'))
    );
  }

  createYear(request: CreateYearRequest): Observable<AcademicYear> {
    return this.http.post<AcademicYear>(`${this.API_URL}/years`, request, { headers: this.getHeaders(true) }).pipe(
      catchError(this.handleError('Erreur lors de la création de l\'année'))
    );
  }

  updateYear(id: string, year: Partial<AcademicYear>): Observable<AcademicYear> {
    return this.http.put<AcademicYear>(`${this.API_URL}/years/${id}`, year, { headers: this.getHeaders(true) }).pipe(
      catchError(this.handleError('Erreur lors de la mise à jour de l\'année académique'))
    );
  }

  // --- Workflow de l'année ---

  activateYear(id: string): Observable<void> {
    return this.http.patch<void>(`${this.API_URL}/years/${id}/activate`, {}, { headers: this.getHeaders(true) }).pipe(
      catchError(this.handleError('Erreur lors de l\'activation de l\'année'))
    );
  }

  closeYear(id: string): Observable<void> {
    return this.http.patch<void>(`${this.API_URL}/years/${id}/close`, {}, { headers: this.getHeaders(true) }).pipe(
      catchError(this.handleError('Erreur lors de la clôture de l\'année'))
    );
  }

  reopenYear(id: string): Observable<void> {
    return this.http.patch<void>(`${this.API_URL}/years/${id}/reopen`, {}, { headers: this.getHeaders(true) }).pipe(
      catchError(this.handleError('Erreur lors de la réouverture de l\'année'))
    );
  }

  archiveYear(id: string): Observable<void> {
    return this.http.patch<void>(`${this.API_URL}/years/${id}/archive`, {}, { headers: this.getHeaders(true) }).pipe(
      catchError(this.handleError('Erreur lors de l\'archivage de l\'année'))
    );
  }

  // ===========================================
  // PÉRIODES & CONGÉS
  // ===========================================

  getPeriods(yearId: string): Observable<Period[]> {
    return this.http.get<Period[]>(`${this.API_URL}/years/${yearId}/periods`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors du chargement des périodes'))
    );
  }

  createPeriod(yearId: string, period: Partial<Period>): Observable<Period> {
    return this.http.post<Period>(`${this.API_URL}/years/${yearId}/periods`, period, { headers: this.getHeaders(true) }).pipe(
      catchError(this.handleError('Erreur lors de la création de la période'))
    );
  }

  updatePeriod(yearId: string, id: string, period: Partial<Period>): Observable<Period> {
    return this.http.put<Period>(`${this.API_URL}/years/${yearId}/periods/${id}`, period, { headers: this.getHeaders(true) }).pipe(
      catchError(this.handleError('Erreur lors de la mise à jour de la période'))
    );
  }

  deletePeriod(yearId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/years/${yearId}/periods/${id}`, { headers: this.getHeaders(true) }).pipe(
      catchError(this.handleError('Erreur lors de la suppression de la période'))
    );
  }

  getHolidays(yearId: string): Observable<Holiday[]> {
    return this.http.get<Holiday[]>(`${this.API_URL}/years/${yearId}/holidays`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors du chargement des congés'))
    );
  }

  createHoliday(yearId: string, holiday: Partial<Holiday>): Observable<Holiday> {
    return this.http.post<Holiday>(`${this.API_URL}/years/${yearId}/holidays`, holiday, { headers: this.getHeaders(true) }).pipe(
      catchError(this.handleError('Erreur lors de la création du congé'))
    );
  }

  updateHoliday(yearId: string, id: string, holiday: Partial<Holiday>): Observable<Holiday> {
    return this.http.put<Holiday>(`${this.API_URL}/years/${yearId}/holidays/${id}`, holiday, { headers: this.getHeaders(true) }).pipe(
      catchError(this.handleError('Erreur lors de la mise à jour du congé'))
    );
  }

  deleteHoliday(yearId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/years/${yearId}/holidays/${id}`, { headers: this.getHeaders(true) }).pipe(
      catchError(this.handleError('Erreur lors de la suppression du congé'))
    );
  }

  // ===========================================
  // GESTION DES CLASSES (OPÉRATIONNEL)
  // ===========================================

  getClassesByYear(yearId: string): Observable<SchoolClass[]> {
    return this.http.get<SchoolClass[]>(`${this.API_URL}/classes/by-year/${yearId}`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors du chargement des classes'))
    );
  }

  getClassById(id: string): Observable<SchoolClass> {
    const directUrl = `${this.API_URL}/classes/${id}`;
    return this.http.get<SchoolClass>(directUrl, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        // Fallback: Rechercher dans la liste de l'année si le GET direct n'est pas autorisé (405)
        if (err.status === 405) {
          console.warn(`[AcademicService] Direct GET on ${directUrl} not allowed (405). Falling back to search in list.`);
          return this.getCurrentYear().pipe(
            switchMap(year => this.getClassesByYear(year.id)),
            map(classes => {
              const found = classes.find(c => String(c.id) === String(id));
              if (!found) throw err; // Relancer l'erreur originale si non trouvé
              return found;
            })
          );
        }
        return throwError(() => err);
      }),
      catchError(this.handleError('Erreur lors du chargement des détails de la classe'))
    );
  }

  createClass(request: CreateClassRequest): Observable<SchoolClass> {
    return this.http.post<SchoolClass>(`${this.API_URL}/classes`, request, { headers: this.getHeaders(true) }).pipe(
      catchError(this.handleError('Erreur lors de la création de la classe'))
    );
  }

  updateClass(id: string, request: Partial<CreateClassRequest>): Observable<SchoolClass> {
    return this.http.put<SchoolClass>(`${this.API_URL}/classes/${id}`, request, { headers: this.getHeaders(true) }).pipe(
      catchError(this.handleError('Erreur lors de la mise à jour de la classe'))
    );
  }

  // ===========================================
  // RÉFÉRENTIEL STRUCTURE (Cycles, Niveaux, Filières)
  // ===========================================

  getCycles(): Observable<Cycle[]> {
    return this.http.get<Cycle[]>(`${this.API_URL}/cycles`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors du chargement des cycles'))
    );
  }

  createCycle(cycle: Partial<Cycle>): Observable<Cycle> {
    return this.http.post<Cycle>(`${this.API_URL}/cycles`, cycle, { headers: this.getHeaders(true) }).pipe(
      catchError(this.handleError('Erreur lors de la création du cycle'))
    );
  }

  updateCycle(id: string, cycle: Partial<Cycle>): Observable<Cycle> {
    return this.http.put<Cycle>(`${this.API_URL}/cycles/${id}`, cycle, { headers: this.getHeaders(true) }).pipe(
      catchError(this.handleError('Erreur lors de la mise à jour du cycle'))
    );
  }

  deleteCycle(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/cycles/${id}`, { headers: this.getHeaders(true) }).pipe(
      catchError(this.handleError('Erreur lors de la suppression du cycle'))
    );
  }

  /**
   * Récupère la structure académique groupée (Cycles -> Niveaux)
   * C'est la nouvelle manière "propre" de récupérer le référentiel.
   */
  getGroupedLevels(): Observable<CycleGroup[]> {
    return this.http.get<CycleGroup[]>(`${this.API_URL}/levels`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors du chargement de la structure académique'))
    );
  }

  /**
   * Récupère la liste à plat des niveaux.
   * Adapté pour les sélecteurs simples.
   */
  getLevels(cycleId?: string): Observable<Level[]> {
    // Si un cycleId est fourni, on peut garder l'ancien endpoint ou filtrer le nouveau
    if (cycleId) {
      let params = new HttpParams().set('cycleId', cycleId);
      return this.http.get<Level[]>(`${this.API_URL}/levels`, { params, headers: this.getHeaders() }).pipe(
        catchError(this.handleError('Erreur lors du chargement des niveaux'))
      );
    }

    // Par défaut, on utilise la structure groupée et on l'aplatit pour la compatibilité
    return this.getGroupedLevels().pipe(
      map(groups => groups.flatMap(g => g.levels))
    );
  }

  createLevel(level: Partial<Level>): Observable<Level> {
    return this.http.post<Level>(`${this.API_URL}/levels`, level, { headers: this.getHeaders(true) }).pipe(
      catchError(this.handleError('Erreur lors de la création du niveau'))
    );
  }

  updateLevel(id: string, level: Partial<Level>): Observable<Level> {
    return this.http.put<Level>(`${this.API_URL}/levels/${id}`, level, { headers: this.getHeaders(true) }).pipe(
      catchError(this.handleError('Erreur lors de la mise à jour du niveau'))
    );
  }

  deleteLevel(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/levels/${id}`, { headers: this.getHeaders(true) }).pipe(
      catchError(this.handleError('Erreur lors de la suppression du niveau'))
    );
  }

  getFilieres(): Observable<Filiere[]> {
    return this.http.get<Filiere[]>(`${this.API_URL}/filieres`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors du chargement des filières'))
    );
  }

  createFiliere(filiere: Partial<Filiere>): Observable<Filiere> {
    return this.http.post<Filiere>(`${this.API_URL}/filieres`, filiere, { headers: this.getHeaders(true) }).pipe(
      catchError(this.handleError('Erreur lors de la création de la filière'))
    );
  }

  deleteFiliere(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/filieres/${id}`, { headers: this.getHeaders(true) }).pipe(
      catchError(this.handleError('Erreur lors de la suppression de la filière'))
    );
  }

  // ===========================================
  // GESTION DES MATIÈRES (RÉFÉRENTIEL)
  // ===========================================

  getSubjects(): Observable<Subject[]> {
    return this.http.get<Subject[]>(`${this.API_URL}/subjects`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors du chargement des matières'))
    );
  }

  createSubject(subject: Partial<Subject>): Observable<Subject> {
    return this.http.post<Subject>(`${this.API_URL}/subjects`, subject, { headers: this.getHeaders(true) }).pipe(
      catchError(this.handleError('Erreur lors de la création de la matière'))
    );
  }

  updateSubject(id: string, subject: Partial<Subject>): Observable<Subject> {
    return this.http.put<Subject>(`${this.API_URL}/subjects/${id}`, subject, { headers: this.getHeaders(true) }).pipe(
      catchError(this.handleError('Erreur lors de la mise à jour de la matière'))
    );
  }

  deleteSubject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/subjects/${id}`, { headers: this.getHeaders(true) }).pipe(
      catchError(this.handleError('Erreur lors de la suppression de la matière'))
    );
  }

  // ===========================================
  // PROGRAMMES (CURRICULUM PER LEVEL)
  // ===========================================

  getCurriculum(levelId: string, filiereId?: string): Observable<CurriculumItem[]> {
    let params = new HttpParams();
    if (filiereId) params = params.set('filiereId', filiereId);

    return this.http.get<CurriculumItem[]>(`${this.API_URL}/curriculum/by-level/${levelId}`, { params, headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors du chargement du programme'))
    );
  }

  addSubjectToCurriculum(request: Partial<CurriculumItem>): Observable<CurriculumItem> {
    return this.http.post<CurriculumItem>(`${this.API_URL}/curriculum`, request, { headers: this.getHeaders(true) }).pipe(
      catchError(this.handleError('Erreur lors de l\'ajout de la matière au programme'))
    );
  }

  updateCurriculumItem(id: string, request: Partial<CurriculumItem>): Observable<CurriculumItem> {
    return this.http.put<CurriculumItem>(`${this.API_URL}/curriculum/${id}`, request, { headers: this.getHeaders(true) }).pipe(
      catchError(this.handleError('Erreur lors de la mise à jour du programme'))
    );
  }

  deleteCurriculumItem(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/curriculum/${id}`, { headers: this.getHeaders(true) }).pipe(
      catchError(this.handleError('Erreur lors de la suppression de l\'élément du programme'))
    );
  }

  // ===========================================
  // SYLLABUS (PROGRESSION PÉDAGOGIQUE)
  // ===========================================

  getSyllabus(curriculumItemId: string): Observable<SyllabusDomain[]> {
    return this.http.get<SyllabusDomain[]>(`${this.API_URL}/curriculum/${curriculumItemId}/syllabus`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors du chargement du syllabus'))
    );
  }

  // ===========================================
  // ENSEIGNEMENTS (TEACHINGS PER CLASS)
  // ===========================================

  getTeachingsByClass(classId: string): Observable<Teaching[]> {
    return this.http.get<Teaching[]>(`${this.API_URL}/classes/${classId}/teachings`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erreur lors du chargement des enseignements'))
    );
  }

  addTeachingToClass(classId: string, request: Partial<Teaching>): Observable<Teaching> {
    return this.http.post<Teaching>(`${this.API_URL}/classes/${classId}/teachings`, request, { headers: this.getHeaders(true) }).pipe(
      catchError(this.handleError('Erreur lors de l\'ajout de l\'enseignement'))
    );
  }

  assignTeacher(classId: string, teachingId: string, teacherId: string): Observable<Teaching> {
    const params = new HttpParams().set('teacherId', teacherId);
    return this.http.patch<Teaching>(`${this.API_URL}/classes/${classId}/teachings/${teachingId}/teacher`, {}, { params, headers: this.getHeaders(true) }).pipe(
      catchError(this.handleError('Erreur lors de l\'assignation du professeur'))
    );
  }

  removeTeachingFromClass(classId: string, teachingId: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/classes/${classId}/teachings/${teachingId}`, { headers: this.getHeaders(true) }).pipe(
      catchError(this.handleError('Erreur lors de la suppression de l\'enseignement'))
    );
  }
}
