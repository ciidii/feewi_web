import {Component, computed, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {CdkDragDrop, DragDropModule, moveItemInArray} from '@angular/cdk/drag-drop';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
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
  Plus,
  ShieldCheck,
  Lock,
  Unlock
} from 'lucide-angular';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  distinctUntilChanged,
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
import {AssignmentSummary, AcademicYear, Level, SchoolClass, StudentAssignment} from '../../../../../core/models/academic.model';

// Components
import {FwPageShellComponent} from '../../../../../shared/components/page-shell/page-shell.component';
import {FwButtonComponent} from '../../../../../shared/components/button/button.component';
import {SkeletonComponent} from '../../../../../shared/components/skeleton/skeleton.component';
import {FwTabsComponent, FwTab} from '../../../../../shared/components/tabs/tabs.component';
import {LucideAngularModule} from 'lucide-angular';
import {AuthService} from '../../../../../core/services/auth.service';
import {HasPermissionDirective} from '../../../../../shared/directives/has-permission.directive';
import {ConfirmDialogComponent, ConfirmDialogData} from '../../../../../shared/components/confirm-dialog/confirm-dialog';

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
    RouterLink,
    HasPermissionDirective,
    FwTabsComponent,
    MatDialogModule,
  ],
  templateUrl: './student-assignment.component.html',
  styleUrls: ['./student-assignment.component.scss']
})
export class StudentAssignmentComponent {
  // --- Services ---
  private academicService = inject(AcademicService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  protected loadingService = inject(LoadingService);

  // --- Vue Direction (supervision) ---
  readonly canSupervise = computed(() => this.authService.hasPermission('academic:assignment:supervise'));
  readonly canValidate = computed(() => this.authService.hasPermission('academic:assignment:validate'));

  // Verrouillage des affectations (BL-FE-ACAD-02). Pas de champ backend pour connaître l'état
  // de verrouillage (GET /summary ne l'expose pas) : état optimiste local, ne survit pas à un
  // rechargement de page tant qu'un futur ticket backend n'ajoute pas cette information.
  readonly lockedLevelIds = signal<Set<string>>(new Set());
  readonly isLockActionLoading = signal<string | null>(null);
  readonly activeTab = signal<'secretariat' | 'direction'>('secretariat');
  readonly tabs = computed<FwTab[]>(() => [
    {id: 'secretariat', label: 'Affectation', icon: this.UserCheck},
    {id: 'direction', label: 'Vue Direction', icon: this.ShieldCheck, disabled: !this.canSupervise()}
  ]);

  readonly isSummaryLoading = signal(false);

  onTabChange(tabId: string) {
    this.activeTab.set(tabId as 'secretariat' | 'direction');
  }

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
  readonly ShieldCheck = ShieldCheck;
  readonly Lock = Lock;
  readonly Unlock = Unlock;

  // --- Triggers ---
  private refresh$ = new BehaviorSubject<void>(undefined);

  // --- UI State (Signals) ---
  readonly selectedYearId = signal<string>('');
  readonly selectedLevelId = signal<string>('');
  readonly searchQuery = signal('');
  readonly isAssigning = signal(false);

  readonly canAssign = computed(() => this.authService.hasPermission('academic:assignment:write'));

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

  // --- Vue Direction : Supervision des affectations ---
  private readonly summary$ = combineLatest([
    toObservable(this.activeTab),
    toObservable(this.selectedYearId)
  ]).pipe(
    distinctUntilChanged(([prevTab, prevYear], [tab, year]) => prevTab === tab && prevYear === year),
    filter(([tab, yearId]) => tab === 'direction' && !!yearId),
    tap(() => this.isSummaryLoading.set(true)),
    switchMap(([, yearId]) => this.academicService.getAssignmentSummary(yearId).pipe(
      catchError(() => {
        this.notificationService.error('Impossible de charger la supervision des affectations.');
        return of([] as AssignmentSummary[]);
      }),
      finalize(() => this.isSummaryLoading.set(false))
    ))
  );

  readonly summary = toSignal(this.summary$, { initialValue: [] as AssignmentSummary[] });
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
      this.notificationService.error(this.describeAssignmentError(error));
    } finally {
      this.isAssigning.set(false);
    }
  }

  /**
   * L'API renvoie 403 (pas 409) pour les deux causes métier possibles — capacité atteinte ou
   * niveau verrouillé (BL-FE-ACAD-02) — on distingue via le message d'erreur du backend.
   */
  private describeAssignmentError(error: any): string {
    if (error?.status === 403 && typeof error?.error?.message === 'string' && error.error.message.includes('verrouill')) {
      return 'Les affectations de ce niveau sont verrouillées par la Direction.';
    }
    if (error?.status === 403) {
      return 'La classe est déjà complète.';
    }
    return "Échec de l'affectation.";
  }

  private confirmAction(title: string, message: string, confirmLabel: string, type: ConfirmDialogData['type']): Promise<boolean> {
    const ref = this.dialog.open(ConfirmDialogComponent, {width: '450px', data: {title, message, confirmLabel, type}});
    return new Promise(resolve => ref.afterClosed().subscribe(res => resolve(!!res)));
  }

  async onValidateLevel(levelId: string) {
    const confirmed = await this.confirmAction(
      'Valider les affectations de ce niveau',
      'Plus aucune affectation ni désaffectation ne sera possible pour ce niveau tant qu\'il n\'est pas déverrouillé.',
      'Verrouiller',
      'warning'
    );
    if (!confirmed) return;

    this.isLockActionLoading.set(levelId);
    try {
      await firstValueFrom(this.academicService.validateAssignments(this.selectedYearId(), levelId));
      this.lockedLevelIds.update(ids => new Set(ids).add(levelId));
      this.notificationService.success('Affectations verrouillées.');
    } catch (error: any) {
      this.notificationService.error('Échec du verrouillage des affectations.');
    } finally {
      this.isLockActionLoading.set(null);
    }
  }

  async onUnlockLevel(levelId: string) {
    const confirmed = await this.confirmAction(
      'Déverrouiller ce niveau',
      'Le Secrétariat pourra de nouveau affecter/désaffecter des élèves pour ce niveau.',
      'Déverrouiller',
      'info'
    );
    if (!confirmed) return;

    this.isLockActionLoading.set(levelId);
    try {
      await firstValueFrom(this.academicService.unlockAssignments(this.selectedYearId(), levelId));
      this.lockedLevelIds.update(ids => {
        const next = new Set(ids);
        next.delete(levelId);
        return next;
      });
      this.notificationService.success('Affectations déverrouillées.');
    } catch (error: any) {
      this.notificationService.error('Échec du déverrouillage des affectations.');
    } finally {
      this.isLockActionLoading.set(null);
    }
  }

  onDrop(event: CdkDragDrop<any[]>, targetClassId?: string) {
    if (!this.canAssign()) {
        this.notificationService.warning("Vous n'avez pas les droits pour affecter des élèves.");
        return;
    }
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
    return cls.currentOccupancy ?? 0;
  }

  getClassGaugeWidth(cls: SchoolClass): number {
    return cls.occupancyRate ?? 0;
  }
}
