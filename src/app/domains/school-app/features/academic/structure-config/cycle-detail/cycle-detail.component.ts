import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Layers, Plus, ListChecks, Edit, Trash2, GraduationCap, Users, Tag } from 'lucide-angular';
import { AcademicService } from '../../../../../../core/services/academic.service';
import { AuthService } from '../../../../../../core/services/auth.service';
import { NavigationStateService } from '../../../../../../core/services/navigation-state.service';
import { NotificationService } from '../../../../../../shared/services/notification.service';
import { Cycle, Level, Filiere } from '../../../../../../core/models/academic.model';
import { DataListComponent } from '../../../../../../shared/components/data-list/data-list.component';
import { TableRow, RowAction } from '../../../../../../shared/models/data-list.models';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { LevelFormComponent } from '../components/level-form/level-form.component';
import { FiliereFormComponent } from '../components/filiere-form/filiere-form.component';
import { CurriculumManagerComponent } from '../components/curriculum-manager/curriculum-manager';
import { ConfirmDialogComponent } from '../../../../../../shared/components/confirm-dialog/confirm-dialog';

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
  levels = signal<Level[]>([]);
  filieres = signal<Filiere[]>([]);
  activeTab = signal<'niveaux' | 'filieres'>('niveaux');
  isLoading = signal(true);

  // Permission de modification (Provisioning)
  readonly canEditStructure = computed(() => this.authService.hasRole('ROLE_SUPER_ADMIN'));

  // Déterminer si les filières sont pertinentes pour ce cycle (ex: Lycée)
  readonly hasFilieres = computed(() => {
    const code = this.cycle()?.cycleCode;
    return code === 'HIGH_SCHOOL' || code === 'TECHNICAL_SCHOOL' || code === 'UNIVERSITY';
  });

  // Actions pour les niveaux
  readonly levelActions = computed<RowAction[]>(() => {
    const actions: RowAction[] = [
      { id: 'curriculum', label: 'Gérer le programme', icon: ListChecks, type: 'success' },
      { id: 'classes', label: 'Gérer les classes', icon: Users, type: 'primary' }
    ];
    
    if (this.canEditStructure()) {
      actions.push({ id: 'edit', label: 'Modifier', icon: Edit, type: 'primary' });
      actions.push({ id: 'delete', label: 'Supprimer', icon: Trash2, type: 'danger' });
    }
    
    return actions;
  });

  // Actions pour les filières
  readonly filiereActions: RowAction[] = [
    { id: 'edit', label: 'Modifier', icon: Edit, type: 'primary' },
    { id: 'delete', label: 'Supprimer', icon: Trash2, type: 'danger' }
  ];

  // Transformation des niveaux pour DataList
  displayLevels = computed<TableRow[]>(() => {
    return this.levels()
      .sort((a, b) => a.rank - b.rank)
      .map(level => ({
        id: level.id,
        title: level.name,
        subtitle: `Rang de progression : ${level.rank}`,
        avatarLabel: level.name.substring(0, 2).toUpperCase(),
        badges: [{ label: 'ACTIF', type: 'success' }],
        rawData: level
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
      const [allCycles, allLevels, allFilieres] = await Promise.all([
        this.academicService.getCycles(),
        this.academicService.getLevels(),
        this.academicService.getFilieres()
      ]);

      const currentCycle = allCycles.find(c => c.id === id);
      if (currentCycle) {
        this.cycle.set(currentCycle);
        const cycleName = currentCycle.customName || currentCycle.systemName;
        this.navState.setBreadcrumb(['Accueil', 'Structure', cycleName]);
      } else {
        this.notificationService.error("Cycle non trouvé.");
      }

      // Filtrage des niveaux appartenant à ce cycle
      const cycleLevels = allLevels.filter(l => String(l.cycleId || (l as any).cycle?.id) === String(id));
      this.levels.set(cycleLevels);

      // Note: Dans une version future de l'API, les filières seront liées au cycle.
      // Pour l'instant on affiche toutes les filières si le cycle le permet.
      this.filieres.set(allFilieres);

    } catch (error) {
      this.notificationService.error("Erreur lors du chargement du cycle.");
    } finally {
      this.isLoading.set(false);
    }
  }

  setTab(tab: 'niveaux' | 'filieres') {
    this.activeTab.set(tab);
  }

  // --- GESTION DES NIVEAUX ---

  openAddLevel() {
    const dialogRef = this.dialog.open(LevelFormComponent, {
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'feewi-dialog-panel',
      data: { cycleId: this.cycleId() }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.cycleId()) this.loadData(this.cycleId()!);
    });
  }

  handleLevelAction(event: { actionId: string, row: TableRow }) {
    if (event.actionId === 'curriculum') {
      this.openCurriculumManager(event.row.rawData);
    } else if (event.actionId === 'classes') {
      this.goToClasses(event.row.id as string);
    } else if (event.actionId === 'edit') {
      this.openEditLevel(event.row.rawData);
    } else if (event.actionId === 'delete') {
      this.confirmDeleteLevel(event.row.id as string, event.row.title);
    }
  }

  private goToClasses(levelId: string) {
    this.router.navigate(['/school-app/academic/classes'], { queryParams: { levelId } });
  }

  private openCurriculumManager(level: Level) {
    this.dialog.open(CurriculumManagerComponent, {
      width: '1000px',
      maxWidth: '95vw',
      panelClass: 'feewi-dialog-panel',
      data: { level }
    });
  }

  private openEditLevel(level: Level) {
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

  private async confirmDeleteLevel(id: string, name: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer le niveau ?',
        message: `Vous êtes sur le point de supprimer le niveau "${name}". Cette action est irréversible.`,
        confirmLabel: 'Oui, supprimer',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (confirmed) {
        try {
          await this.academicService.deleteLevel(id);
          this.notificationService.success('Le niveau a été supprimé.');
          if (this.cycleId()) this.loadData(this.cycleId()!);
        } catch (error) {
          this.notificationService.error('Impossible de supprimer ce niveau.');
        }
      }
    });
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
