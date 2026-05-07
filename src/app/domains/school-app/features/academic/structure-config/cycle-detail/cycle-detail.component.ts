import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {
  ArrowLeft,
  Edit,
  GraduationCap,
  Layers,
  ListChecks,
  LucideAngularModule,
  Plus,
  Tag,
  Trash2,
  Users
} from 'lucide-angular';
import {firstValueFrom} from 'rxjs';
import {AcademicService} from '../../../../../../core/services/academic.service';
import {AuthService} from '../../../../../../core/services/auth.service';
import {NavigationStateService} from '../../../../../../core/services/navigation-state.service';
import {NotificationService} from '../../../../../../shared/services/notification.service';
import {LoadingService} from '../../../../../../shared/services/loading.service';
import {AcademicYear, Cycle, Filiere, Level, SchoolClass} from '../../../../../../core/models/academic.model';
import {DataListComponent} from '../../../../../../shared/components/data-list/data-list.component';
import {RowAction, TableRow} from '../../../../../../shared/models/data-list.models';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {LevelFormComponent} from '../components/level-form/level-form.component';
import {FiliereFormComponent} from '../components/filiere-form/filiere-form.component';
import {CurriculumManagerComponent} from '../components/curriculum-manager/curriculum-manager';
import {ClassFormComponent} from '../../class-list/components/class-form/class-form.component';
import {FwButtonComponent} from '../../../../../../shared/components/button/button.component';
import {FwEmptyStateComponent} from '../../../../../../shared/components/empty-state/empty-state.component';
import {FwPageShellComponent} from '../../../../../../shared/components/page-shell/page-shell.component';
import {FwTab} from '../../../../../../shared/components/tabs/tabs.component';

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
    FwPageShellComponent
  ],
  templateUrl: './cycle-detail.component.html',
  styleUrls: ['./cycle-detail.component.scss']
})
export class CycleDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private academicService = inject(AcademicService);
  private authService = inject(AuthService);
  private navState = inject(NavigationStateService);
  private notificationService = inject(NotificationService);
  protected loadingService = inject(LoadingService);
  private dialog = inject(MatDialog);

  // Icons
  readonly ArrowLeft = ArrowLeft;
  readonly Layers = Layers;
  readonly Plus = Plus;
  readonly ListChecks = ListChecks;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly GraduationCap = GraduationCap;
  readonly Tag = Tag;
  readonly Users = Users;

  // États
  cycleId = signal<string | null>(null);
  cycle = signal<Cycle | null>(null);
  currentYear = signal<AcademicYear | null>(null);
  levels = signal<Level[]>([]);
  classes = signal<SchoolClass[]>([]);
  filieres = signal<Filiere[]>([]);
  activeTab = signal('pilotage');

  // Configuration des Onglets
  readonly cycleTabs = computed<FwTab[]>(() => {
    const tabs: FwTab[] = [
      { id: 'pilotage', label: 'Pilotage & Classes', icon: GraduationCap }
    ];
    if (this.hasFilieres()) {
      tabs.push({ id: 'filieres', label: 'Séries & Filières', icon: Tag });
    }
    return tabs;
  });

  // Permission de modification (Provisioning)
  readonly canEditStructure = computed(() => this.authService.hasRole('ROLE_SUPER_ADMIN'));

  // Déterminer si les filières sont pertinentes pour ce cycle (ex: Lycée)
  readonly hasFilieres = computed(() => {
    const code = this.cycle()?.cycleCode;
    return code === 'HIGH_SCHOOL' || code === 'TECHNICAL_SCHOOL' || code === 'UNIVERSITY';
  });

  // Actions pour les filières
  readonly filiereActions: RowAction[] = [
    {id: 'edit', label: 'Modifier', icon: Edit, type: 'primary'},
    {id: 'delete', label: 'Supprimer', icon: Trash2, type: 'danger'}
  ];

  // Groupement des classes par niveau pour la vue "Pilotage"
  levelGroups = computed<LevelGroup[]>(() => {
    const allLevels = [...this.levels()].sort((a, b) => a.rank - b.rank);
    const allClasses = this.classes();

    return allLevels.map(lvl => ({
      level: lvl,
      classes: allClasses.filter(cls => String(lvl.id) === String(cls.levelId))
    }));
  });

  // Transformation des filières pour DataList
  displayFilieres = computed<TableRow[]>(() => {
    return this.filieres().map(f => ({
      id: f.id,
      title: f.name,
      subtitle: `Code série : ${f.code}`,
      avatarLabel: f.code.substring(0, 2).toUpperCase(),
      badges: [{label: 'SÉRIE', type: 'info'}],
      rawData: f
    }));
  });

  richDescription = computed(() => {
    const c = this.cycle();
    if (!c) return 'Chargement...';
    return `${this.levels().length} Niveaux • ${this.classes().length} Classes ouvertes • Session ${this.currentYear()?.label || '...'}`;
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.cycleId.set(id);
        this.loadData(id);
      }
    });
  }

  async loadData(id: string) {
    await this.loadingService.execute(async () => {
      try {
        // 1. CHARGEMENT DE LA STRUCTURE (Obligatoire)
        const [allCycles, allLevels, allFilieres] = await Promise.all([
          firstValueFrom(this.academicService.getCycles()),
          firstValueFrom(this.academicService.getLevels()),
          firstValueFrom(this.academicService.getFilieres())
        ]);

        const currentCycle = allCycles.find(c => String(c.id) === String(id));

        if (currentCycle) {
          this.cycle.set(currentCycle);
          const cycleName = currentCycle.customName || currentCycle.systemName || currentCycle.cycleCode || currentCycle.id;
          this.navState.setBreadcrumb(['Accueil', 'Structure', cycleName]);

          const cycleLevels = allLevels.filter(l => {
            const levelCycleId = l.cycleId || (l as any).cycle?.id;
            const levelCycleCode = (l as any).cycle?.code || (l as any).cycle?.cycleCode;
            return String(levelCycleId) === String(id) || (levelCycleCode && levelCycleCode === currentCycle.cycleCode);
          });
          this.levels.set(cycleLevels);
        } else {
          this.notificationService.error("Cycle non trouvé.");
        }
        this.filieres.set(allFilieres);

        // 2. CHARGEMENT OPÉRATIONNEL (Résilient)
        try {
          const year = await firstValueFrom(this.academicService.getCurrentYear());
          this.currentYear.set(year);

          if (year) {
            const yearClasses = await firstValueFrom(this.academicService.getClassesByYear(year.id));
            this.classes.set(yearClasses);
          }
        } catch (yearError) {
          console.warn("[CycleDetail] Aucune année académique active trouvée. Mode structure uniquement.");
          this.currentYear.set(null);
          this.classes.set([]);
        }

      } catch (error) {
        console.error("[CycleDetail] Erreur fatale lors du chargement de la structure:", error);
        this.notificationService.error("Impossible de charger la structure du cycle.");
      }
    }, 'component');
  }

  setTab(tab: 'pilotage' | 'filieres') {
    this.activeTab.set(tab);
  }

  // --- GESTION DES NIVEAUX & PROGRAMMES ---

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
      if (result && this.cycleId()) this.loadData(this.cycleId()!);
    });
  }

  // --- GESTION DES CLASSES ---

  openAddClass(level: Level) {
    const currentCycle = this.cycle();
    const dialogRef = this.dialog.open(ClassFormComponent, {
      width: '640px',
      maxWidth: '95vw',
      panelClass: 'feewi-dialog-panel',
      data: {
        year: this.currentYear(),
        groupedLevels: [{
          cycle: currentCycle,
          levels: this.levels()
        }],
        levelId: level.id
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.cycleId()) this.loadData(this.cycleId()!);
    });
  }

  goToClassDetails(cls: SchoolClass) {
    this.router.navigate(['/admin/academic/classes'], {queryParams: {classId: cls.id}});
  }

  // --- GESTION DES FILIÈRES ---

  openAddFiliere() {
    const dialogRef = this.dialog.open(FiliereFormComponent, {
      width: '480px',
      panelClass: 'feewi-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.cycleId()) this.loadData(this.cycleId()!);
    });
  }

  handleFiliereAction(event: { actionId: string, row: TableRow }) {
    this.notificationService.info("Action sur filière bientôt disponible.");
  }
}
