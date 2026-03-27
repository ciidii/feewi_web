import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { LucideAngularModule, ListChecks, Plus, Trash2, Edit, Save, X, BookOpen, Hash, Clock } from 'lucide-angular';
import { AcademicService } from '../../../../../../../core/services/academic.service';
import { CurriculumItem, Level, Subject } from '../../../../../../../core/models/academic.model';
import { NotificationService } from '../../../../../../../shared/services/notification.service';
import { DataListComponent } from '../../../../../../../shared/components/data-list/data-list.component';
import { TableRow, RowAction } from '../../../../../../../shared/models/data-list.models';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmDialogComponent } from '../../../../../../../shared/components/confirm-dialog/confirm-dialog';
import { SyllabusViewerComponent } from '../syllabus-viewer/syllabus-viewer';

@Component({
  selector: 'app-curriculum-manager',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MatDialogModule, DataListComponent, ReactiveFormsModule],
  templateUrl: './curriculum-manager.html',
  styleUrls: ['./curriculum-manager.scss']
})
export class CurriculumManagerComponent implements OnInit {
  private academicService = inject(AcademicService);
  private notificationService = inject(NotificationService);
  private dialogRef = inject(MatDialogRef<CurriculumManagerComponent>);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  data: { level: Level } = inject(MAT_DIALOG_DATA);

  // Icônes
  readonly ListChecks = ListChecks;
  readonly Plus = Plus;
  readonly X = X;
  readonly Save = Save;
  readonly BookOpen = BookOpen;
  readonly Clock = Clock;

  // États
  curriculumItems = signal<CurriculumItem[]>([]);
  allSubjects = signal<Subject[]>([]);
  isLoading = signal(true);
  isAdding = signal(false);
  editingItem = signal<CurriculumItem | null>(null);

  /** Volume horaire total hebdo pour ce niveau */
  totalWeeklyHours = computed(() => {
    return this.curriculumItems().reduce((sum, item) => sum + (item.weeklyHours || 0), 0);
  });

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
    { id: 'syllabus', label: 'Voir le Syllabus', icon: BookOpen, type: 'primary' },
    { id: 'edit', label: 'Modifier', icon: Edit, type: 'primary' },
    { id: 'delete', label: 'Retirer du programme', icon: Trash2, type: 'danger' }
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
    this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    try {
      const [curriculum, subjects] = await Promise.all([
        firstValueFrom(this.academicService.getCurriculum(this.data.level.id)),
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

    const item = this.editingItem();
    const payload = this.addForm.value;

    try {
      if (item) {
        // Mode Édition
        await firstValueFrom(this.academicService.updateCurriculumItem(item.id, payload));
        this.notificationService.success('Modification enregistrée.');
      } else {
        // Mode Ajout
        const request = { ...payload, levelId: this.data.level.id };
        await firstValueFrom(this.academicService.addSubjectToCurriculum(request));
        this.notificationService.success('Matière ajoutée au programme.');
      }

      this.cancelForm();
      this.loadData();
    } catch (error) {
      this.notificationService.error("Erreur lors de l'enregistrement.");
    }
  }

  cancelForm() {
    this.isAdding.set(false);
    this.editingItem.set(null);
    this.addForm.reset({ defaultCoefficient: 1, weeklyHours: 2, maxScore: 20, optional: false });
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
    // On désactive le choix de la matière en édition
    this.addForm.get('subjectId')?.disable();
  }

  private async confirmRemoveSubject(id: string, name: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Retirer la matière ?',
        message: `Voulez-vous retirer "${name}" du programme du niveau ${this.data.level.name} ? Cela n'affectera pas la matière dans la bibliothèque globale.`,
        confirmLabel: 'Oui, retirer',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (confirmed) {
        try {
          await firstValueFrom(this.academicService.deleteCurriculumItem(id));
          this.notificationService.success('Matière retirée du programme.');
          this.loadData();
        } catch (error) {
          this.notificationService.error("Impossible de retirer cette matière.");
        }
      }
    });
  }

  close() {
    this.dialogRef.close();
  }
}
