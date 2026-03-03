import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LucideAngularModule, BookOpenCheck, Plus, X, Save, ArrowRight } from 'lucide-angular';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {DataListComponent} from '../../../../../../../shared/components/data-list/data-list.component';
import {AcademicService} from '../../../../../../../core/services/academic.service';
import {IdentityService} from '../../../../../../../core/services/identity.service';
import {NotificationService} from '../../../../../../../shared/services/notification.service';
import {CurriculumItem, SchoolClass, Teaching} from '../../../../../../../core/models/academic.model';
import {User} from '../../../../../../../core/models/user.model';
import {RowAction, TableRow} from '../../../../../../../shared/models/data-list.models';

@Component({
  selector: 'app-teaching-manager',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MatDialogModule, DataListComponent, ReactiveFormsModule],
  templateUrl: './teaching-manager.html',
  styleUrls: ['./teaching-manager.scss']
})
export class TeachingManagerComponent implements OnInit {
  private academicService = inject(AcademicService);
  private identityService = inject(IdentityService);
  private notificationService = inject(NotificationService);
  private dialogRef = inject(MatDialogRef<TeachingManagerComponent>);
  private fb = inject(FormBuilder);
  data: { schoolClass: SchoolClass } = inject(MAT_DIALOG_DATA);

  // Icônes
  readonly BookOpenCheck = BookOpenCheck;
  readonly Plus = Plus;
  readonly X = X;
  readonly Save = Save;
  readonly ArrowRight = ArrowRight;

  // États
  teachings = signal<Teaching[]>([]);
  availableCurriculum = signal<CurriculumItem[]>([]);
  staffList = signal<User[]>([]);
  isLoading = signal(true);
  isAdding = signal(false);

  // Formulaire d'affectation
  assignForm: FormGroup = this.fb.group({
    subjectId: ['', [Validators.required]],
    teacherId: ['', [Validators.required]],
    coefficient: [1, [Validators.required]],
    maxScore: [20, [Validators.required]]
  });

  // Actions
  readonly teachingActions: RowAction[] = [
    { id: 'delete', label: 'Retirer l\'enseignement', icon: X, type: 'danger' }
  ];

  // Données transformées pour l'affichage
  displayTeachings = computed<TableRow[]>(() => {
    return this.teachings().map(t => ({
      id: t.id,
      title: t.subjectName || 'Matière inconnue',
      subtitle: `Professeur: ${t.teacherName || 'Non assigné'}`,
      avatarLabel: (t.subjectName || '??').substring(0, 2).toUpperCase(),
      badges: [
        { label: `Coeff: ${t.coefficient}`, type: 'info' },
        { label: `Sur ${t.maxScore}`, type: 'default' }
      ],
      rawData: t
    }));
  });

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    try {
      // 1. Charger les enseignements actuels de la classe
      const teachings = await this.academicService.getTeachingsByClass(this.data.schoolClass.id);
      this.teachings.set(teachings);

      // 2. Charger le programme du niveau pour savoir quoi proposer
      const curriculum = await this.academicService.getCurriculum(
        this.data.schoolClass.levelId,
        this.data.schoolClass.filiereId || undefined
      );
      this.availableCurriculum.set(curriculum);

      // 3. Charger la liste du personnel (ENSEIGNANTS uniquement)
      await this.identityService.getStaff('', 0, 100, 'TEACHER');
      const staffPage = this.identityService.staffPage();
      if (staffPage) {
        this.staffList.set(staffPage.content);
      }

    } catch (error) {
      this.notificationService.error("Erreur lors du chargement des données pédagogiques.");
    } finally {
      this.isLoading.set(false);
    }
  }

  onSubjectChange(subjectId: string) {
    const item = this.availableCurriculum().find(c => c.subjectId === subjectId);
    if (item) {
      this.assignForm.patchValue({
        coefficient: item.defaultCoefficient,
        maxScore: item.maxScore
      });
    }
  }

  async onAssign() {
    if (this.assignForm.invalid) return;

    try {
      await this.academicService.assignTeacher(this.data.schoolClass.id, this.assignForm.value);
      this.notificationService.success('Enseignement programmé avec succès.');
      this.isAdding.set(false);
      this.assignForm.reset({ coefficient: 1, maxScore: 20 });
      this.loadData();
    } catch (error) {
      this.notificationService.error("Échec de l'affectation.");
    }
  }

  close() {
    this.dialogRef.close();
  }
}
