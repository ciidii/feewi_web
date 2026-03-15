import { Component, inject, OnInit, signal, computed, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, School, Plus, Layers, ChevronRight, Trash2, Edit, BookOpen, Tag, ListChecks } from 'lucide-angular';
import { AcademicService } from '../../../../../core/services/academic.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { NotificationService } from '../../../../../shared/services/notification.service';
import { Cycle, Level, Filiere, Subject } from '../../../../../core/models/academic.model';
import { DataListComponent } from '../../../../../shared/components/data-list/data-list.component';
import { TableRow, RowAction } from '../../../../../shared/models/data-list.models';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { LevelFormComponent } from './components/level-form/level-form.component';
import { CycleFormComponent } from './components/cycle-form/cycle-form.component';
import { FiliereFormComponent } from './components/filiere-form/filiere-form.component';
import { SubjectFormComponent } from './components/subject-form/subject-form.component';
import { CurriculumManagerComponent } from './components/curriculum-manager/curriculum-manager';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog';


@Component({
  selector: 'app-structure-config',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, DataListComponent, MatDialogModule],
  templateUrl: './structure-config.component.html',
  styleUrls: ['./structure-config.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class StructureConfigComponent implements OnInit {
  private academicService = inject(AcademicService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);

  // Icônes
  readonly School = School;
  readonly Plus = Plus;
  readonly Layers = Layers;
  readonly ChevronRight = ChevronRight;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly BookOpen = BookOpen;
  readonly Tag = Tag;
  readonly ListChecks = ListChecks;

  // États
  activeTab = signal<'niveaux' | 'filieres' | 'matieres'>('niveaux');
  cycles = signal<Cycle[]>([]);
  levels = signal<Level[]>([]);
  filieres = signal<Filiere[]>([]);
  subjects = signal<Subject[]>([]);
  selectedCycleId = signal<string | null>(null);
  isLoading = signal(true);

  // Autorisations (Provisioning)
  readonly canEditStructure = computed(() => this.authService.hasRole('ROLE_SUPER_ADMIN'));

  // Actions pour les niveaux
  readonly levelActions = computed<RowAction[]>(() => {
    const actions: RowAction[] = [
      { id: 'curriculum', label: 'Gérer le programme', icon: ListChecks, type: 'success' }
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

  // Actions pour les matières
  readonly subjectActions: RowAction[] = [
    { id: 'edit', label: 'Modifier', icon: Edit, type: 'primary' },
    { id: 'delete', label: 'Supprimer', icon: Trash2, type: 'danger' }
  ];

  // Niveaux transformés pour le DataList
  displayLevels = computed<TableRow[]>(() => {
    const selectedId = this.selectedCycleId();
    const allLevels = this.levels();
    if (!selectedId) return [];
    const filtered = allLevels.filter(level => {
      const levelCycleId = level.cycleId || (level as any).cycle?.id;
      return String(levelCycleId) === String(selectedId);
    });
    return filtered
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

  // Filières transformées pour le DataList
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

  // Matières transformées pour le DataList
  displaySubjects = computed<TableRow[]>(() => {
    return this.subjects().map(s => ({
      id: s.id,
      title: s.name,
      subtitle: `Code technique : ${s.code}`,
      avatarLabel: s.code.substring(0, 2).toUpperCase(),
      badges: [{ label: 'MATIÈRE', type: 'info' }],
      rawData: s
    }));
  });

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    try {
      const [cyclesData, levelsData, filieresData, subjectsData] = await Promise.all([
        this.academicService.getCycles(),
        this.academicService.getLevels(),
        this.academicService.getFilieres(),
        this.academicService.getSubjects()
      ]);
      this.cycles.set(cyclesData);
      this.levels.set(levelsData);
      this.filieres.set(filieresData);
      this.subjects.set(subjectsData);

      if (cyclesData.length > 0 && !this.selectedCycleId()) {
        this.selectedCycleId.set(cyclesData[0].id);
      }
    } catch (error) {
      this.notificationService.error("Erreur lors du chargement de la structure.");
    } finally {
      this.isLoading.set(false);
    }
  }

  setTab(tab: 'niveaux' | 'filieres' | 'matieres') {
    this.activeTab.set(tab);
  }

  selectCycle(id: string) {
    this.selectedCycleId.set(id);
  }

  // --- ACTIONS MATIÈRES ---

  handleSubjectAction(event: { actionId: string, row: TableRow }) {
    if (event.actionId === 'edit') {
      this.openAddSubjectForm(event.row.rawData);
    } else {
      this.notificationService.info("Suppression bientôt disponible.");
    }
  }

  openAddSubjectForm(subject?: Subject) {
    const dialogRef = this.dialog.open(SubjectFormComponent, {
      width: '480px',
      panelClass: 'feewi-dialog-panel',
      data: { subject }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadData();
    });
  }

  // --- ACTIONS FILIÈRES ---

  handleFiliereAction(event: { actionId: string, row: TableRow }) {
    this.notificationService.info("Action sur filière bientôt disponible.");
  }

  openAddFiliere() {
    const dialogRef = this.dialog.open(FiliereFormComponent, {
      width: '480px',
      panelClass: 'feewi-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadData();
    });
  }

  // --- ACTIONS CYCLES ---

  onEditCycle(cycle: Cycle) {
    const dialogRef = this.dialog.open(CycleFormComponent, {
      width: '480px',
      panelClass: 'feewi-dialog-panel',
      data: { cycle }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadData();
    });
  }

  onDeleteCycle(cycle: Cycle) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer le cycle ?',
        message: `Voulez-vous supprimer le cycle "${cycle.name}" ? Tous les niveaux rattachés à ce cycle pourraient être impactés.`,
        confirmLabel: 'Oui, supprimer le cycle',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (confirmed) {
        try {
          await this.academicService.deleteCycle(cycle.id);
          this.notificationService.success('Cycle supprimé avec succès.');
          this.loadData();
        } catch (error) {
          this.notificationService.error('Erreur lors de la suppression.');
        }
      }
    });
  }

  // --- ACTIONS NIVEAUX ---

  handleLevelAction(event: { actionId: string, row: TableRow }) {
    if (event.actionId === 'curriculum') {
      this.openCurriculumManager(event.row.rawData);
    } else if (event.actionId === 'edit') {
      this.openEditLevel(event.row.rawData);
    } else if (event.actionId === 'delete') {
      this.confirmDeleteLevel(event.row.id as string, event.row.title);
    }
  }

  private openCurriculumManager(level: Level) {
    this.dialog.open(CurriculumManagerComponent, {
      width: '900px',
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
      if (result) this.loadData();
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
          this.loadData();
        } catch (error) {
          this.notificationService.error('Impossible de supprimer ce niveau.');
        }
      }
    });
  }

  openAddCycle() {
    const dialogRef = this.dialog.open(CycleFormComponent, {
      width: '480px',
      panelClass: 'feewi-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData();
      }
    });
  }

  openAddLevel() {
    const dialogRef = this.dialog.open(LevelFormComponent, {
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'feewi-dialog-panel',
      data: { cycleId: this.selectedCycleId() }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData();
      }
    });
  }
}
