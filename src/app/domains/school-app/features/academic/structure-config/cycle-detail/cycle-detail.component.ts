import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Layers, Plus, ListChecks, Edit, Trash2, GraduationCap, Users, Tag } from 'lucide-angular';
import { AcademicService } from '../../../../../../core/services/academic.service';
import { AuthService } from '../../../../../../core/services/auth.service';
import { NavigationStateService } from '../../../../../../core/services/navigation-state.service';
import { NotificationService } from '../../../../../../shared/services/notification.service';
import { Cycle, Level, Filiere, SchoolClass, AcademicYear } from '../../../../../../core/models/academic.model';
import { DataListComponent } from '../../../../../../shared/components/data-list/data-list.component';
import { TableRow, RowAction } from '../../../../../../shared/models/data-list.models';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { LevelFormComponent } from '../components/level-form/level-form.component';
import { FiliereFormComponent } from '../components/filiere-form/filiere-form.component';
import { CurriculumManagerComponent } from '../components/curriculum-manager/curriculum-manager';
import { ConfirmDialogComponent } from '../../../../../../shared/components/confirm-dialog/confirm-dialog';

export interface LevelGroup {
  level: Level;
  classes: SchoolClass[];
}

@Component({
  selector: 'app-cycle-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, DataListComponent, MatDialogModule],
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
  activeTab = signal<'pilotage' | 'filieres'>('pilotage');
  isLoading = signal(true);

  // Permission de modification (Provisioning)
  readonly canEditStructure = computed(() => this.authService.hasRole('ROLE_SUPER_ADMIN'));

  // Déterminer si les filières sont pertinentes pour ce cycle (ex: Lycée)
  readonly hasFilieres = computed(() => {
    const code = this.cycle()?.cycleCode;
    return code === 'HIGH_SCHOOL' || code === 'TECHNICAL_SCHOOL' || code === 'UNIVERSITY';
  });

  // Actions pour les filières
  readonly filiereActions: RowAction[] = [
    { id: 'edit', label: 'Modifier', icon: Edit, type: 'primary' },
    { id: 'delete', label: 'Supprimer', icon: Trash2, type: 'danger' }
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
      badges: [{ label: 'SÉRIE', type: 'info' }],
      rawData: f
    }));
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
    this.isLoading.set(true);
    try {
      // 1. CHARGEMENT DE LA STRUCTURE (Obligatoire)
      const [allCycles, allLevels, allFilieres] = await Promise.all([
        this.academicService.getCycles(),
        this.academicService.getLevels(),
        this.academicService.getFilieres()
      ]);

      const currentCycle = allCycles.find(c => String(c.id) === String(id));

      if (currentCycle) {
        this.cycle.set(currentCycle);
        const cycleName = currentCycle.customName || currentCycle.systemName;
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

      // 2. CHARGEMENT OPÉRATIONNEL (Résilient : ne bloque pas si échec)
      try {
        const year = await this.academicService.getCurrentYear();
        this.currentYear.set(year);
        
        if (year) {
          const yearClasses = await this.academicService.getClassesByYear(year.id);
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
    } finally {
      this.isLoading.set(false);
    }
  }

  setTab(tab: 'pilotage' | 'filieres') {
    this.activeTab.set(tab);
  }

  // --- GESTION DES NIVEAUX & PROGRAMMES ---

  openCurriculumManager(level: Level) {
    this.dialog.open(CurriculumManagerComponent, {
      width: '1000px',
      maxWidth: '95vw',
      panelClass: 'feewi-dialog-panel',
      data: { level }
    });
  }

  openEditLevel(level: Level) {
    const dialogRef = this.dialog.open(LevelFormComponent, {
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'feewi-dialog-panel',
      data: { level }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.cycleId()) this.loadData(this.cycleId()!);
    });
  }

  // --- GESTION DES CLASSES ---

  openAddClass(level: Level) {
    this.notificationService.info(`Ouverture de classe en ${level.name} bientôt disponible.`);
  }

  goToClassDetails(cls: SchoolClass) {
    this.router.navigate(['/school-app/academic/classes'], { queryParams: { classId: cls.id } });
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
