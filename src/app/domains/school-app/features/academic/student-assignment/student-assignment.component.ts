import {Component, computed, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {CdkDragDrop, DragDropModule, moveItemInArray} from '@angular/cdk/drag-drop';
import {
  Users,
  Search,
  ArrowRight,
  Filter,
  RefreshCw,
  School,
  CheckCircle,
  LayoutGrid,
  ChevronRight,
  UserCheck,
  ChevronLeft,
  X,
  History,
  GraduationCap,
  Calendar,
  Plus
} from 'lucide-angular';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  filter,
  finalize,
  firstValueFrom,
  forkJoin,
  map,
  of,
  switchMap,
  tap
} from 'rxjs';

// Services
import {AcademicService} from '../../../../../core/services/academic.service';
import {NotificationService} from '../../../../../shared/services/notification.service';
import {LoadingService} from '../../../../../shared/services/loading.service';

// Models
import {AcademicYear, Level, SchoolClass, StudentAssignment} from '../../../../../core/models/academic.model';

// Components
import {FwPageShellComponent} from '../../../../../shared/components/page-shell/page-shell.component';
import {FwButtonComponent} from '../../../../../shared/components/button/button.component';
import {SkeletonComponent} from '../../../../../shared/components/skeleton/skeleton.component';
import {LucideAngularModule} from 'lucide-angular';

@Component({
  selector: 'app-student-assignment',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    FwPageShellComponent,
    FwButtonComponent,
    FormsModule,
    SkeletonComponent,
    DragDropModule,
    RouterLink
  ],
  templateUrl: './student-assignment.component.html',
  styleUrls: ['./student-assignment.component.scss']
})
export class StudentAssignmentComponent {
  // --- Services ---
  private academicService = inject(AcademicService);
  private notificationService = inject(NotificationService);
  private route = inject(ActivatedRoute);
  protected loadingService = inject(LoadingService);

  // --- Icons ---
  readonly Users = Users;
  readonly Search = Search;
  readonly ArrowRight = ArrowRight;
  readonly Filter = Filter;
  readonly RefreshCw = RefreshCw;
  readonly School = School;
  readonly CheckCircle = CheckCircle;
  readonly LayoutGrid = LayoutGrid;
  readonly ChevronRight = ChevronRight;
  readonly UserCheck = UserCheck;
  readonly ChevronLeft = ChevronLeft;
  readonly X = X;
  readonly History = History;
  readonly GraduationCap = GraduationCap;
  readonly Calendar = Calendar;
  readonly Plus = Plus;

  // --- Triggers ---
  private refresh$ = new BehaviorSubject<void>(undefined);

  // --- UI State (Signals) ---
  readonly selectedYearId = signal<string>('');
  readonly selectedLevelId = signal<string>('');
  readonly searchQuery = signal('');
  readonly isAssigning = signal(false);

  // --- Foundation Data (Signals) ---
  private readonly foundation$ = combineLatest([
    this.academicService.getYears(),
    this.route.queryParamMap
  ]).pipe(
    switchMap(([years, params]) => forkJoin({
      years: of(years),
      levels: this.academicService.getLevels(),
      queryParamLevelId: of(params.get('levelId'))
    })),
    tap(data => {
      // 1. Initialiser l'année active si pas déjà fait
      if (!this.selectedYearId()) {
        const activeYear = data.years.find(y => y.status === 'ACTIVE') || data.years[0];
        if (activeYear) this.selectedYearId.set(activeYear.id);
      }
      
      // 2. Initialiser le niveau (Priorité : QueryParam > Premier de la liste)
      if (data.queryParamLevelId) {
        this.selectedLevelId.set(data.queryParamLevelId);
      } else if (data.levels.length > 0 && !this.selectedLevelId()) {
        this.selectedLevelId.set(data.levels[0].id);
      }
    }),
    catchError(err => {
      this.notificationService.error("Impossible de charger les données de base.");
      return of({ years: [] as AcademicYear[], levels: [] as Level[] });
    })
  );

  readonly foundation = toSignal(this.foundation$, { initialValue: { years: [], levels: [] } });
  readonly years = computed(() => this.foundation().years);
  readonly levels = computed(() => this.foundation().levels);

  // --- Operational Data (Signals) ---
  private readonly operational$ = combineLatest([
    toObservable(this.selectedYearId),
    toObservable(this.selectedLevelId),
    this.refresh$
  ]).pipe(
    filter(([yearId, levelId]) => !!yearId && !!levelId),
    tap(() => this.loadingService.start('component')),
    switchMap(([yearId, levelId]) => forkJoin({
      waiting: this.academicService.getWaitingAssignments(yearId, levelId),
      classes: this.academicService.getClassesByYear(yearId)
    }).pipe(
      map(data => ({
        waiting: data.waiting,
        // Filtrer les classes pour ne garder que celles du niveau sélectionné
        targetClasses: data.classes.filter(c => String(c.levelId) === String(levelId))
      })),
      finalize(() => this.loadingService.stop())
    )),
    catchError(err => {
      this.notificationService.error("Erreur lors du chargement de la répartition.");
      return of({ waiting: [] as StudentAssignment[], targetClasses: [] as SchoolClass[] });
    })
  );

  readonly operational = toSignal(this.operational$, { initialValue: { waiting: [], targetClasses: [] } });
  readonly waitingList = computed(() => this.operational().waiting);
  readonly targetClasses = computed(() => this.operational().targetClasses);
  readonly emptyArray: any[] = [];

  // --- Derived Calculations ---
  readonly filteredWaitingList = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const list = this.waitingList();
    if (!query) return list;
    return list.filter(a =>
      `${a.studentFirstName} ${a.studentLastName}`.toLowerCase().includes(query) ||
      (a.registrationNumber && a.registrationNumber.toLowerCase().includes(query))
    );
  });

  readonly isLoading = computed(() => this.loadingService.isLoading());

  // --- Actions ---
  refresh() {
    this.refresh$.next();
  }

  async onAssign(assignmentId: string, classId: string) {
    this.isAssigning.set(true);
    try {
      await firstValueFrom(this.academicService.assignStudent(assignmentId, classId));
      this.notificationService.success("Élève affecté avec succès.");
      this.refresh();
    } catch (error: any) {
      if (error.status === 409) {
        this.notificationService.error("La classe est déjà complète.");
      } else {
        this.notificationService.error("Échec de l'affectation.");
      }
    } finally {
      this.isAssigning.set(false);
    }
  }

  onDrop(event: CdkDragDrop<any[]>, targetClassId?: string) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const assignment = event.item.data as StudentAssignment;
      if (targetClassId) {
        this.onAssign(assignment.id, targetClassId);
      }
    }
  }

  getClassFillRate(cls: SchoolClass): number {
    return cls.currentStudentCount || 0;
  }

  getClassGaugeWidth(cls: SchoolClass): number {
    if (!cls.capacity) return 0;
    return Math.min(100, (this.getClassFillRate(cls) / cls.capacity) * 100);
  }
}
