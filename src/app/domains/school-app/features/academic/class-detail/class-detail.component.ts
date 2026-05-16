import {Component, computed, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {
  ArrowLeft,
  Calendar,
  ClipboardList,
  GraduationCap,
  Layers,
  LucideAngularModule,
  Plus,
  RefreshCw,
  Search,
  UserCheck,
  Users,
  Settings,
  MoreVertical,
  Trash2,
  Edit,
  UserPlus,
  Download,
  BookOpen,
  School,
  Activity
} from 'lucide-angular';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  filter,
  finalize,
  forkJoin,
  map,
  of,
  switchMap,
  tap
} from 'rxjs';

// Services
import {AcademicService} from '../../../../../core/services/academic.service';
import {IdentityService} from '../../../../../core/services/identity.service';
import {NavigationStateService} from '../../../../../core/services/navigation-state.service';
import {NotificationService} from '../../../../../shared/services/notification.service';
import {LoadingService} from '../../../../../shared/services/loading.service';

// Models
import {Level, SchoolClass, StudentAssignment, Subject, Teaching} from '../../../../../core/models/academic.model';
import {User} from '../../../../../core/models/user.model';
import {FwTab} from '../../../../../shared/components/tabs/tabs.component';
import {RowAction, TableRow} from '../../../../../shared/models/data-list.models';

// Components
import {FwButtonComponent} from '../../../../../shared/components/button/button.component';
import {FwPageShellComponent} from '../../../../../shared/components/page-shell/page-shell.component';
import {FwEmptyStateComponent} from '../../../../../shared/components/empty-state/empty-state.component';
import {FwBadgeComponent} from '../../../../../shared/components/badge/badge.component';
import {DataListComponent} from '../../../../../shared/components/data-list/data-list.component';
import {FwListCommandBarComponent} from '../../../../../shared/components/list-command-bar/list-command-bar.component';
import {BlockLoaderComponent} from '../../../../../shared/components/loader/block-loader.component';

@Component({
  selector: 'app-class-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule,
    MatDialogModule,
    FwButtonComponent,
    FwPageShellComponent,
    FwEmptyStateComponent,
    DataListComponent,
    FwListCommandBarComponent,
    BlockLoaderComponent
  ],
  templateUrl: './class-detail.component.html',
  styleUrls: ['./class-detail.component.scss']
})
export class ClassDetailComponent {
  // --- Services ---
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private academicService = inject(AcademicService);
  private identityService = inject(IdentityService);
  private navState = inject(NavigationStateService);
  private notificationService = inject(NotificationService);
  protected loadingService = inject(LoadingService);



  // --- Triggers ---
  private refresh$ = new BehaviorSubject<void>(undefined);

  // --- UI State ---
  readonly activeTab = signal<'students' | 'teachings' | 'schedule'>('students');
  readonly searchQuery = signal('');
  readonly isActionLoading = signal(false);

  // --- Reactive Data (State Management) ---
  readonly classId = toSignal(this.route.paramMap.pipe(map(p => p.get('id'))));

  private readonly state$ = combineLatest([
    toObservable(this.classId),
    this.refresh$
  ]).pipe(
    filter(([id]) => !!id),
    tap(() => this.loadingService.start('component')),
    switchMap(([id]) => this.fetchClassData(id!).pipe(
      finalize(() => this.loadingService.stop())
    ))
  );

  private readonly state = toSignal(this.state$);

  // --- Derived Signals (Public API for Template) ---
  readonly schoolClass = computed(() => this.state()?.schoolClass || null);
  readonly assignments = computed(() => this.state()?.assignments || []);
  readonly teachings = computed(() => this.state()?.teachings || []);
  readonly allSubjects = computed(() => this.state()?.subjects || []);
  readonly staffList = computed(() => this.state()?.staff || []);

  readonly isLoading = computed(() => this.loadingService.isLoading());

  readonly classTabs: FwTab[] = [
    { id: 'students', label: 'Élèves', icon: Users },
    { id: 'teachings', label: 'Enseignements', icon: GraduationCap },
    { id: 'schedule', label: 'Emploi du temps', icon: Calendar }
  ];

  // Actions
  readonly studentActions: RowAction[] = [
    { id: 'view', label: 'Voir fiche', icon: Search, type: 'primary' },
    { id: 'remove', label: 'Désaffecter', icon: Trash2, type: 'danger' }
  ];

  readonly teamActions: RowAction[] = [
    { id: 'edit', label: 'Modifier', icon: Edit, type: 'primary' },
    { id: 'remove', label: 'Supprimer', icon: Trash2, type: 'danger' }
  ];

  // DataList Transformations
  readonly displayStudents = computed<TableRow[]>(() => {
    const query = this.searchQuery().toLowerCase();
    return this.assignments()
      .filter(a => !query ||
        a.studentFirstName?.toLowerCase().includes(query) ||
        a.studentLastName?.toLowerCase().includes(query))
      .map(a => ({
        id: a.id,
        title: `${a.studentFirstName} ${a.studentLastName}`,
        subtitle: `Inscrit le ${new Date(a.assignedAt || '').toLocaleDateString()}`,
        avatarLabel: this.getAvatarLabel(a.studentFirstName, a.studentLastName),
        badges: [{ label: 'ACTIF', type: 'success' }],
        rawData: a
      }));
  });

  readonly displayTeam = computed<TableRow[]>(() => {
    const query = this.searchQuery().toLowerCase();
    return this.teachings()
      .filter(t => !query || t.subjectName?.toLowerCase().includes(query) || t.teacherName?.toLowerCase().includes(query))
      .map(t => ({
        id: t.id,
        title: t.subjectName || this.getSubjectName(t.subjectId),
        subtitle: t.teacherName || this.getTeacherName(t.teacherId),
        avatarLabel: t.subjectName?.substring(0, 2).toUpperCase() || '??',
        badges: [
          { label: `Coef. ${t.coefficient}`, type: 'info' },
          { label: t.teacherId ? 'ASSIGNÉ' : 'À POURVOIR', type: t.teacherId ? 'success' : 'warning' }
        ],
        rawData: t
      }));
  });

  readonly richDescription = computed(() => {
    const cls = this.schoolClass();
    if (!cls) return 'Chargement...';
    return `${cls.levelName || 'Niveau inconnu'} • ${cls.currentOccupancy ?? this.assignments().length} élèves • Capacité: ${cls.capacity}`;
  });

  // --- Data Fetching Logic ---
  private fetchClassData(id: string) {
    return forkJoin({
      schoolClass: this.academicService.getClassById(id),
      assignments: this.academicService.getAssignmentsByClass(id),
      teachings: this.academicService.getTeachingsByClass(id),
      subjects: this.academicService.getSubjects(),
      staffPage: this.identityService.getStaff('', 0, 100, 'TEACHER')
    }).pipe(
      map(data => ({
        schoolClass: data.schoolClass,
        assignments: data.assignments,
        teachings: data.teachings,
        subjects: data.subjects,
        staff: data.staffPage.content
      })),
      tap(data => {
        const className = data.schoolClass?.fullName || data.schoolClass?.name || 'Classe';
        this.navState.setBreadcrumb(['Accueil', 'Classes', className]);
      }),
      catchError(error => {
        console.error("[ClassDetail] Error loading data:", error);
        this.notificationService.error("Impossible de charger les détails de la classe.");
        return of({
          schoolClass: null,
          assignments: [],
          teachings: [],
          subjects: [],
          staff: []
        });
      })
    );
  }

  // --- Action Methods ---
  refresh() {
    this.refresh$.next();
  }

  setTab(tab: any) {
    this.activeTab.set(tab);
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
  }

  handleStudentAction(event: { actionId: string, row: TableRow }) {
    if (event.actionId === 'view') {
      const assignment = event.row.rawData as StudentAssignment;
      this.router.navigate(['/admin/registry/students', assignment.studentId]);
    } else if (event.actionId === 'remove') {
      this.notificationService.info("Désaffectation bientôt disponible.");
    }
  }

  handleTeamAction(event: { actionId: string, row: TableRow }) {
    this.notificationService.info("Gestion d'enseignement bientôt disponible.");
  }

  getSubjectName(subjectId: string): string {
    return this.allSubjects().find(s => s.id === subjectId)?.name || 'Matière inconnue';
  }

  getTeacherName(teacherId: string): string {
    const teacher = this.staffList().find(s => s.id === teacherId);
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Non assigné';
  }

  getAvatarLabel(firstName?: string, lastName?: string): string {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  }

  // --- Icons ---
  readonly ArrowLeft = ArrowLeft;
  readonly Layers = Layers;
  readonly Users = Users;
  readonly GraduationCap = GraduationCap;
  readonly ClipboardList = ClipboardList;
  readonly Calendar = Calendar;
  readonly Search = Search;
  readonly Plus = Plus;
  readonly RefreshCw = RefreshCw;
  readonly UserCheck = UserCheck;
  readonly Settings = Settings;
  readonly MoreVertical = MoreVertical;
  readonly Trash2 = Trash2;
  readonly Edit = Edit;
  readonly UserPlus = UserPlus;
  readonly Download = Download;
  readonly BookOpen = BookOpen;
  readonly School = School;
  readonly Activity = Activity;
}
