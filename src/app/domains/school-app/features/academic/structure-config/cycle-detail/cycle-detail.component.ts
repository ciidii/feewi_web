import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Layers, Plus, ListChecks, Edit, Trash2, GraduationCap, Users } from 'lucide-angular';
import { AcademicService } from '../../../../../../core/services/academic.service';
import { AuthService } from '../../../../../../core/services/auth.service';
import { NavigationStateService } from '../../../../../../core/services/navigation-state.service';
import { NotificationService } from '../../../../../../shared/services/notification.service';
import { Cycle, Level } from '../../../../../../core/models/academic.model';
import { DataListComponent } from '../../../../../../shared/components/data-list/data-list.component';
import { TableRow, RowAction } from '../../../../../../shared/models/data-list.models';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { LevelFormComponent } from '../components/level-form/level-form.component';
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

  cycleId = signal<string | null>(null);
  cycle = signal<Cycle | null>(null);
  levels = signal<Level[]>([]);
  isLoading = signal(true);

  readonly canEditStructure = computed(() => this.authService.hasRole('ROLE_SUPER_ADMIN'));

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
      // Pour l'instant on récupère tous les cycles et on filtre.
      // Idéalement on aurait un endpoint getCycleById et getLevelsByCycle.
      const [allCycles, allLevels] = await Promise.all([
        this.academicService.getCycles(),
        this.academicService.getLevels()
      ]);

      const currentCycle = allCycles.find(c => c.id === id);
      if (currentCycle) {
        this.cycle.set(currentCycle);
        this.navState.setBreadcrumb(['Accueil', 'Structure', currentCycle.name]);
      } else {
        this.notificationService.error("Cycle non trouvé.");
      }

      const cycleLevels = allLevels.filter(l => String(l.cycleId || (l as any).cycle?.id) === String(id));
      this.levels.set(cycleLevels);

    } catch (error) {
      this.notificationService.error("Erreur lors du chargement du cycle.");
    } finally {
      this.isLoading.set(false);
    }
  }

  openAddLevel() {
    const dialogRef = this.dialog.open(LevelFormComponent, {
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'feewi-dialog-panel',
      data: { cycleId: this.cycleId() }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.cycleId()) {
        this.loadData(this.cycleId()!);
      }
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
      if (result && this.cycleId()) {
        this.loadData(this.cycleId()!);
      }
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
}
