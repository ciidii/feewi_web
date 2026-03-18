import { Component, inject, OnInit, signal, computed, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule, School, Plus, Layers, ChevronRight, Trash2, Edit, BookOpen, Tag, ListChecks, ArrowRight } from 'lucide-angular';
import { AcademicService } from '../../../../../core/services/academic.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { NotificationService } from '../../../../../shared/services/notification.service';
import { Cycle, Filiere, Subject } from '../../../../../core/models/academic.model';
import { DataListComponent } from '../../../../../shared/components/data-list/data-list.component';
import { TableRow, RowAction } from '../../../../../shared/models/data-list.models';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CycleFormComponent } from './components/cycle-form/cycle-form.component';
import { FiliereFormComponent } from './components/filiere-form/filiere-form.component';
import { SubjectFormComponent } from './components/subject-form/subject-form.component';
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
  private router = inject(Router);

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
  readonly ArrowRight = ArrowRight;

  // États
  activeTab = signal<'cycles' | 'filieres' | 'matieres'>('cycles');
  cycles = signal<Cycle[]>([]);
  filieres = signal<Filiere[]>([]);
  subjects = signal<Subject[]>([]);
  isLoading = signal(true);

  // Autorisations (Provisioning)
  readonly canEditStructure = computed(() => this.authService.hasRole('ROLE_SUPER_ADMIN'));

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
      const [cyclesData, filieresData, subjectsData] = await Promise.all([
        this.academicService.getCycles(),
        this.academicService.getFilieres(),
        this.academicService.getSubjects()
      ]);

      // Filtrage par provisioning (Cycles autorisés)
      const allowedCycles = cyclesData.filter(c => 
        this.authService.hasRole('ROLE_SUPER_ADMIN') || this.authService.isCycleAllowed(c.code)
      );

      this.cycles.set(allowedCycles.sort((a, b) => a.rank - b.rank));
      this.filieres.set(filieresData);
      this.subjects.set(subjectsData);
    } catch (error) {
      this.notificationService.error("Erreur lors du chargement de la structure.");
    } finally {
      this.isLoading.set(false);
    }
  }

  setTab(tab: 'cycles' | 'filieres' | 'matieres') {
    this.activeTab.set(tab);
  }

  // Navigation vers le Drill-down
  goToCycle(id: string) {
    this.router.navigate(['/classes/cycles', id]);
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

  // --- ACTIONS CYCLES (Super Admin uniquement) ---

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
}
