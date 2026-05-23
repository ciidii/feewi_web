import {Component, computed, effect, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {
  ArrowLeft,
  BookOpenCheck,
  Edit,
  Filter,
  GraduationCap,
  Layers,
  LayoutGrid,
  List,
  ListChecks,
  LucideAngularModule,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  UserCheck,
  Users
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
import {AcademicService} from '../../../../../../core/services/academic.service';
import {AuthService} from '../../../../../../core/services/auth.service';
import {NavigationStateService} from '../../../../../../core/services/navigation-state.service';
import {NotificationService} from '../../../../../../shared/services/notification.service';
import {LoadingService} from '../../../../../../shared/services/loading.service';

// Models
import {AcademicYear, Cycle, Filiere, Level, SchoolClass} from '../../../../../../core/models/academic.model';
import {RowAction, TableRow} from '../../../../../../shared/models/data-list.models';

// Components
import {DataListComponent} from '../../../../../../shared/components/data-list/data-list.component';
import {LevelFormComponent} from '../components/level-form/level-form.component';
import {FiliereFormComponent} from '../components/filiere-form/filiere-form.component';
import {ClassFormComponent} from '../components/class-form/class-form.component';
import {FwButtonComponent} from '../../../../../../shared/components/button/button.component';
import {FwEmptyStateComponent} from '../../../../../../shared/components/empty-state/empty-state.component';
import {FwPageShellComponent} from '../../../../../../shared/components/page-shell/page-shell.component';
import {FwTab} from '../../../../../../shared/components/tabs/tabs.component';
import {FwListCommandBarComponent} from '../../../../../../shared/components/list-command-bar/list-command-bar.component';
import {CycleDetailSkeletonComponent} from '../../../../shared/components/skeleton/cycle-detail-skeleton.component';
import {HasPermissionDirective} from '../../../../../../shared/directives/has-permission.directive';

export interface LevelGroup {
  level: Level;
  classes: SchoolClass[];
}

@Component({
  selector: 'app-cycle-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule,
    DataListComponent,
    MatDialogModule,
    FwButtonComponent,
    FwEmptyStateComponent,
    FwPageShellComponent,
    FwListCommandBarComponent,
    CycleDetailSkeletonComponent,
    HasPermissionDirective
  ],
  templateUrl: './cycle-detail.component.html',
  styleUrls: ['./cycle-detail.component.scss']
})
export class CycleDetailComponent implements OnInit {
  // --- Services ---
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private academicService = inject(AcademicService);
  private authService = inject(AuthService);
  private navState = inject(NavigationStateService);
  private notificationService = inject(NotificationService);
  protected loadingService = inject(LoadingService);
  private dialog = inject(MatDialog);

  // --- RxJS Triggers ---
  private refresh$ = new BehaviorSubject<void>(undefined);

  // --- UI State (Signals) ---
  readonly activeTab = signal<'pilotage' | 'filieres'>('pilotage');
  readonly viewMode = signal<'tiles' | 'table'>('tiles');
  readonly searchQuery = signal('');

  // --- Reactive Data (Signals) ---
  readonly cycleId = toSignal(this.route.paramMap.pipe(map(p => p.get('id'))));

  private readonly state$ = combineLatest([
    toObservable(this.cycleId),
    this.refresh$
  ]).pipe(
    filter(([id]) => !!id),
    tap(() => this.loadingService.start('component')),
    switchMap(([id]) => this.fetchCycleData(id!).pipe(
      finalize(() => this.loadingService.stop())
    ))
  );

  private readonly state = toSignal(this.state$);

  // --- Derived Signals (Public API) ---
  readonly cycle = computed(() => this.state()?.cycle || null);
  readonly currentYear = computed(() => this.state()?.year || null);
  readonly levels = computed(() => this.state()?.levels || []);
  readonly classes = computed(() => this.state()?.classes || []);
  readonly filieres = computed(() => this.state()?.filieres || []);

  readonly cycleTabs = computed<FwTab[]>(() => {
    const tabs: FwTab[] = [{ id: 'pilotage', label: 'Pilotage & Classes', icon: GraduationCap }];
    if (this.hasFilieres()) {
      tabs.push({ id: 'filieres', label: 'Séries & Filières', icon: Tag });
    }
    return tabs;
  });

  readonly canEditStructure = computed(() => this.authService.hasPermission('academic:structure:write'));

  readonly hasFilieres = computed(() => {
    const code = this.cycle()?.cycleCode;
    return code === 'HIGH_SCHOOL' || code === 'TECHNICAL_SCHOOL' || code === 'UNIVERSITY';
  });

  readonly filiereActions: RowAction[] = [
    {id: 'edit', label: 'Modifier', icon: Edit, type: 'primary', permission: 'academic:structure:write'},
    {id: 'delete', label: 'Supprimer', icon: Trash2, type: 'danger', permission: 'academic:structure:write'}
  ];

  readonly classActions: RowAction[] = [
    { id: 'view', label: 'Détails', icon: Search, type: 'primary', permission: 'academic:structure:read' },
    { id: 'teachings', label: 'Enseignements', icon: BookOpenCheck, type: 'default', permission: 'academic:teaching:write' },
    { id: 'delete', label: 'Supprimer', icon: Trash2, type: 'danger', permission: 'academic:structure:write' }
  ];

  levelGroups = computed<LevelGroup[]>(() => {
    const allLevels = [...this.levels()].sort((a, b) => a.rank - b.rank);
    const allClasses = this.classes();
    const query = this.searchQuery().toLowerCase();

    return allLevels
      .map(lvl => ({
        level: lvl,
        classes: allClasses.filter(cls => String(lvl.id) === String(cls.levelId))
      }))
      .filter(group => {
        if (!query) return true;
        return group.level.name.toLowerCase().includes(query) ||
               group.classes.some(cls => cls.name.toLowerCase().includes(query));
      });
  });

  displayAllClasses = computed<TableRow[]>(() => {
    const query = this.searchQuery().toLowerCase();
    return this.classes()
      .filter(c => !query || c.fullName.toLowerCase().includes(query))
      .map(c => ({
        id: c.id,
        title: c.fullName,
        subtitle: `${c.levelName || 'Niveau inconnu'} • Capacité: ${c.capacity} places`,
        avatarLabel: c.name,
        badges: [
          { label: 'OPÉRATIONNELLE', type: 'success' },
          { label: c.filiereCode || 'Tronc Commun', type: 'info' }
        ],
        rawData: c
      }));
  });

  displayFilieres = computed<TableRow[]>(() => {
    const query = this.searchQuery().toLowerCase();
    return this.filieres()
      .filter(f => !query || f.name.toLowerCase().includes(query) || f.code.toLowerCase().includes(query))
      .map(f => ({
        id: f.id,
        title: f.name,
        subtitle: `Code série : ${f.code}`,
        avatarLabel: f.code.substring(0, 2).toUpperCase(),
        badges: [{label: 'SÉRIE', type: 'info'}],
        rawData: f
      }));
  });

  activeFilterChips = computed(() => {
    const chips: any[] = [];
    if (this.searchQuery()) {
      chips.push({ key: 'q', label: 'Recherche', value: this.searchQuery() });
    }
    return chips;
  });

  richDescription = computed(() => {
    const c = this.cycle();
    if (!c) return 'Chargement...';
    return `${this.levels().length} Niveaux • ${this.classes().length} Classes ouvertes • Session ${this.currentYear()?.label || '...'}`;
  });

  // --- Lifecycle ---
  constructor() {
    effect(() => {
      const c = this.cycle();
      if (c) {
        const cycleName = c.customName || c.systemName || c.cycleCode || c.id;
        this.navState.setBreadcrumb(['Accueil', 'Structure', cycleName]);
      }
    });
  }

  ngOnInit() {
    // Initialisation
  }

  // --- Private Data Methods ---

  private fetchCycleData(id: string) {
    return forkJoin({
      cycles: this.academicService.getCycles(),
      levels: this.academicService.getLevels(),
      filieres: this.academicService.getFilieres(),
      year: this.academicService.getCurrentYear().pipe(catchError(() => of(null)))
    }).pipe(
      switchMap(res => {
        const currentCycle = res.cycles.find(c => String(c.id) === String(id));

        if (!currentCycle) {
          this.notificationService.error("Cycle non trouvé.");
          return of({ cycle: null, levels: [], filieres: [], year: null, classes: [] });
        }

        // Filtrage manuel des niveaux
        const cycleLevels = res.levels.filter(l => {
          const levelCycleId = l.cycleId || (l as any).cycle?.id;
          const levelCycleCode = (l as any).cycle?.code || (l as any).cycle?.cycleCode;
          return String(levelCycleId) === String(id) || (levelCycleCode && levelCycleCode === currentCycle.cycleCode);
        });

        const base = {
          cycle: currentCycle,
          levels: cycleLevels,
          filieres: res.filieres,
          year: res.year
        };

        if (base.year) {
          return this.academicService.getClassesByYear(base.year.id).pipe(
            map(classes => ({ ...base, classes })),
            catchError(() => of({ ...base, classes: [] }))
          );
        }
        return of({ ...base, classes: [] });
      }),
      catchError(error => {
        console.error("[CycleDetail] Erreur lors du chargement:", error);
        this.notificationService.error("Impossible de charger la structure du cycle.");
        return of({ cycle: null, levels: [], filieres: [], year: null, classes: [] });
      })
    );
  }

  // --- Public Action Methods ---

  refresh() {
    this.refresh$.next();
  }

  setTab(tab: 'pilotage' | 'filieres') {
    this.activeTab.set(tab);
  }

  toggleViewMode() {
    this.viewMode.set(this.viewMode() === 'tiles' ? 'table' : 'tiles');
  }

  openCurriculumManager(level: Level) {
    this.router.navigate(['/admin/classes/levels', level.id, 'curriculum']);
  }

  openEditLevel(level: Level) {
    const dialogRef = this.dialog.open(LevelFormComponent, {
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'feewi-dialog-panel',
      data: {level}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.refresh();
    });
  }

  openAddClass(level: Level) {
    const currentCycle = this.cycle();
    const dialogRef = this.dialog.open(ClassFormComponent, {
      width: '640px',
      maxWidth: '95vw',
      panelClass: 'feewi-dialog-panel',
      data: {
        year: this.currentYear(),
        groupedLevels: [{ cycle: currentCycle, levels: this.levels() }],
        levelId: level.id
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.refresh();
    });
  }

  goToClassDetails(cls: SchoolClass) {
    this.router.navigate(['/admin/classes/detail', cls.id]);
  }

  openAddFiliere() {
    const dialogRef = this.dialog.open(FiliereFormComponent, {
      width: '480px',
      panelClass: 'feewi-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.refresh();
    });
  }

  handleFiliereAction(event: { actionId: string, row: TableRow }) {
    this.notificationService.info("Action sur filière bientôt disponible.");
  }

  handleClassAction(event: { actionId: string, row: TableRow }) {
    if (['view', 'teachings'].includes(event.actionId)) {
      this.router.navigate(['/admin/classes/detail', event.row.id]);
    } else if (event.actionId === 'delete') {
      this.notificationService.info("Suppression bientôt disponible.");
    }
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
  }

  removeFilter(key: string) {
    if (key === 'q') this.searchQuery.set('');
  }

  clearAllFilters() {
    this.searchQuery.set('');
  }

  // --- Icons ---
  readonly ArrowLeft = ArrowLeft;
  readonly Layers = Layers;
  readonly Plus = Plus;
  readonly ListChecks = ListChecks;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly GraduationCap = GraduationCap;
  readonly Tag = Tag;
  readonly Users = Users;
  readonly RefreshCw = RefreshCw;
  readonly Filter = Filter;
  readonly UserCheck = UserCheck;
  readonly LayoutGrid = LayoutGrid;
  readonly List = List;
  readonly Search = Search;
}
