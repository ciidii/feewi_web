import {Component, computed, inject, OnInit, signal, ViewEncapsulation} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, RouterModule} from '@angular/router';
import {firstValueFrom} from 'rxjs';
import {
  BookOpen,
  Clock,
  Edit,
  GraduationCap,
  ListChecks,
  LucideAngularModule,
  Plus,
  Save,
  Trash2,
  X
} from 'lucide-angular';
import {AcademicService} from '../../../../../../core/services/academic.service';
import {AuthService} from '../../../../../../core/services/auth.service';
import {CurriculumItem, Level, Subject} from '../../../../../../core/models/academic.model';
import {NotificationService} from '../../../../../../shared/services/notification.service';
import {DataListComponent} from '../../../../../../shared/components/data-list/data-list.component';
import {RowAction, TableRow} from '../../../../../../shared/models/data-list.models';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {ConfirmDialogComponent} from '../../../../../../shared/components/confirm-dialog/confirm-dialog';
import {SyllabusViewerComponent} from '../components/syllabus-viewer/syllabus-viewer';
import {FwButtonComponent} from '../../../../../../shared/components/button/button.component';
import {FwInfoCardComponent} from '../../../../../../shared/components/info-card/info-card.component';
import {FwPageShellComponent} from '../../../../../../shared/components/page-shell/page-shell.component';
import {BlockLoaderComponent} from '../../../../../../shared/components/loader/block-loader.component';
import {HasPermissionDirective} from '../../../../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-curriculum-detail',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    RouterModule,
    DataListComponent,
    ReactiveFormsModule,
    MatDialogModule,
    FwButtonComponent,
    FwInfoCardComponent,
    FwPageShellComponent,
    BlockLoaderComponent,
    HasPermissionDirective
  ],
  templateUrl: './curriculum-detail.component.html',
  styleUrls: ['./curriculum-detail.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CurriculumDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private academicService = inject(AcademicService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);

  // Icônes
  readonly ListChecks = ListChecks;
  readonly Plus = Plus;
  readonly X = X;
  readonly Save = Save;
  readonly BookOpen = BookOpen;
  readonly Clock = Clock;
  readonly GraduationCap = GraduationCap;
  readonly Edit = Edit;

  // États
  levelId = signal<string | null>(null);
  level = signal<Level | null>(null);
  curriculumItems = signal<CurriculumItem[]>([]);
  allSubjects = signal<Subject[]>([]);
  isLoading = signal(true);
  isActionLoading = signal(false);
  isAdding = signal(false);
  editingItem = signal<CurriculumItem | null>(null);

  /** Volume horaire total hebdo pour ce niveau */
  totalWeeklyHours = computed(() => {
    return this.curriculumItems().reduce((sum, item) => sum + (item.weeklyHours || 0), 0);
  });

  mandatoryCount = computed(() => this.curriculumItems().filter(i => !i.optional).length);
  optionalCount = computed(() => this.curriculumItems().filter(i => i.optional).length);

  readonly canEditStructure = computed(() => this.authService.hasPermission('academic:structure:write'));

  // Formulaire d'ajout rapide
  addForm: FormGroup = this.fb.group({
    subjectId: ['', [Validators.required]],
    defaultCoefficient: [1, [Validators.required, Validators.min(0.5)]],
    weeklyHours: [2, [Validators.required, Validators.min(0.5)]],
    maxScore: [20, [Validators.required]],
    optional: [false]
  });

  // Actions
  readonly curriculumActions: RowAction[] = [
    { id: 'syllabus', label: 'Voir le Syllabus', icon: BookOpen, type: 'primary', permission: 'academic:structure:read' },
    { id: 'edit', label: 'Modifier', icon: Edit, type: 'primary', permission: 'academic:structure:write' },
    { id: 'delete', label: 'Retirer du programme', icon: Trash2, type: 'danger', permission: 'academic:structure:write' }
  ];

  // Données transformées pour l'affichage
  displayItems = computed<TableRow[]>(() => {
    return this.curriculumItems().map(item => ({
      id: item.id,
      title: item.subjectName || 'Matière inconnue',
      subtitle: `Coefficient: ${item.defaultCoefficient} • Volume: ${item.weeklyHours}h/sem • Max: ${item.maxScore}`,
      avatarLabel: (item.subjectName || '??').substring(0, 2).toUpperCase(),
      badges: [
        { label: `${item.weeklyHours}H`, type: 'info' },
        { label: item.optional ? 'OPTIONNELLE' : 'OBLIGATOIRE', type: item.optional ? 'info' : 'success' }
      ],
      rawData: item
    }));
  });

  // Matières disponibles (pas encore dans le programme)
  availableSubjects = computed(() => {
    const assignedSubjectIds = this.curriculumItems().map(item => item.subjectId);
    return this.allSubjects().filter(s => !assignedSubjectIds.includes(s.id));
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.levelId.set(id);
        this.loadData(id);
      }
    });
  }

  async loadData(id: string) {
    this.isLoading.set(true);
    try {
      // Charger le niveau lui-même pour le titre
      const levels = await firstValueFrom(this.academicService.getLevels());
      const currentLevel = levels.find(l => String(l.id) === String(id));
      if (currentLevel) this.level.set(currentLevel);

      const [curriculum, subjects] = await Promise.all([
        firstValueFrom(this.academicService.getCurriculum(id)),
        firstValueFrom(this.academicService.getSubjects())
      ]);
      this.curriculumItems.set(curriculum);
      this.allSubjects.set(subjects);
    } catch (error) {
      this.notificationService.error("Impossible de charger le programme.");
    } finally {
      this.isLoading.set(false);
    }
  }

  async onSave() {
    if (this.addForm.invalid) return;

    this.isActionLoading.set(true);
    const item = this.editingItem();
    const payload = this.addForm.value;

    try {
      if (item) {
        // Mode Édition
        await firstValueFrom(this.academicService.updateCurriculumItem(item.id, payload));
        this.notificationService.success('Modification enregistrée.');
      } else {
        // Mode Ajout
        const request = { ...payload, levelId: this.levelId() };
        await firstValueFrom(this.academicService.addSubjectToCurriculum(request));
        this.notificationService.success('Matière ajoutée au programme.');
      }

      this.cancelForm();
      this.loadData(this.levelId()!);
    } catch (error) {
      this.notificationService.error("Erreur lors de l'enregistrement.");
    } finally {
      this.isActionLoading.set(false);
    }
  }

  cancelForm() {
    this.isAdding.set(false);
    this.editingItem.set(null);
    this.addForm.reset({ defaultCoefficient: 1, weeklyHours: 2, maxScore: 20, optional: false });
    this.addForm.get('subjectId')?.enable();
  }

  handleAction(event: { actionId: string, row: TableRow }) {
    if (event.actionId === 'syllabus') {
      this.openSyllabusViewer(event.row.rawData);
    } else if (event.actionId === 'edit') {
      this.startEdit(event.row.rawData);
    } else if (event.actionId === 'delete') {
      this.confirmRemoveSubject(event.row.id as string, event.row.title);
    }
  }

  private openSyllabusViewer(item: CurriculumItem) {
    this.dialog.open(SyllabusViewerComponent, {
      width: '1000px',
      maxWidth: '95vw',
      panelClass: 'feewi-dialog-panel',
      data: { item }
    });
  }

  private startEdit(item: CurriculumItem) {
    this.editingItem.set(item);
    this.isAdding.set(true);
    this.addForm.patchValue({
      subjectId: item.subjectId,
      defaultCoefficient: item.defaultCoefficient,
      weeklyHours: item.weeklyHours,
      maxScore: item.maxScore,
      optional: item.optional
    });
    this.addForm.get('subjectId')?.disable();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private async confirmRemoveSubject(id: string, name: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Retirer la matière ?',
        message: `Voulez-vous retirer "${name}" du programme du niveau ${this.level()?.name} ? Cela n'affectera pas la matière dans la bibliothèque globale.`,
        confirmLabel: 'Oui, retirer',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (confirmed) {
        this.isActionLoading.set(true);
        try {
          await firstValueFrom(this.academicService.deleteCurriculumItem(id));
          this.notificationService.success('Matière retirée du programme.');
          this.loadData(this.levelId()!);
        } catch (error) {
          this.notificationService.error("Impossible de retirer cette matière.");
        } finally {
          this.isActionLoading.set(false);
        }
      }
    });
  }
}
