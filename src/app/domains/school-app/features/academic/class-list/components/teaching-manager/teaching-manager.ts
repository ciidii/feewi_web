import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {firstValueFrom} from 'rxjs';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {ArrowRight, BookOpenCheck, Info, LucideAngularModule, Plus, Save, Trash2, UserPlus, X} from 'lucide-angular';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatSelectModule} from '@angular/material/select';
import {AcademicService} from '../../../../../../../core/services/academic.service';
import {IdentityService} from '../../../../../../../core/services/identity.service';
import {NotificationService} from '../../../../../../../shared/services/notification.service';
import {SchoolClass, Subject, Teaching} from '../../../../../../../core/models/academic.model';
import {User} from '../../../../../../../core/models/user.model';
import {ConfirmDialogComponent} from '../../../../../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-teaching-manager',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MatDialogModule, ReactiveFormsModule, MatSelectModule],
  templateUrl: './teaching-manager.html',
  styleUrls: ['./teaching-manager.scss']
})
export class TeachingManagerComponent implements OnInit {
  private academicService = inject(AcademicService);
  private identityService = inject(IdentityService);
  private notificationService = inject(NotificationService);
  private dialogRef = inject(MatDialogRef<TeachingManagerComponent>);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  data: { schoolClass: SchoolClass } = inject(MAT_DIALOG_DATA);

  // Icônes
  readonly BookOpenCheck = BookOpenCheck;
  readonly Plus = Plus;
  readonly X = X;
  readonly Save = Save;
  readonly ArrowRight = ArrowRight;
  readonly UserPlus = UserPlus;
  readonly Trash2 = Trash2;
  readonly Info = Info;

  // États
  teachings = signal<Teaching[]>([]);
  allSubjects = signal<Subject[]>([]);
  staffList = signal<User[]>([]);
  isLoading = signal(true);
  isAddingManual = signal(false);

  // Formulaire pour ajout manuel (Hybride)
  manualForm: FormGroup = this.fb.group({
    subjectId: ['', [Validators.required]],
    teacherId: ['', [Validators.required]],
    coefficient: [1, [Validators.required, Validators.min(0.5)]],
    maxScore: [20, [Validators.required]]
  });

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    try {
      // 1. Charger les enseignements actuels (Auto-clonés ou Manuels)
      const teachings = await firstValueFrom(this.academicService.getTeachingsByClass(this.data.schoolClass.id));
      this.teachings.set(teachings);

      // 2. Charger le personnel (ENSEIGNANTS)
      await this.identityService.getStaff('', 0, 100, 'TEACHER');
      const staffPage = this.identityService.staffPage();
      if (staffPage) {
        this.staffList.set(staffPage.content);
      }

      // 3. Charger toutes les matières (pour l'ajout manuel)
      const subjects = await firstValueFrom(this.academicService.getSubjects());
      this.allSubjects.set(subjects);

    } catch (error) {
      this.notificationService.error("Erreur lors du chargement des données pédagogiques.");
    } finally {
      this.isLoading.set(false);
    }
  }

  /** Assigner un professeur à un cours existant (PATCH V4) */
  async onAssignTeacher(teachingId: string, teacherId: string) {
    try {
      await firstValueFrom(this.academicService.assignTeacher(this.data.schoolClass.id, teachingId, teacherId));
      this.notificationService.success('Enseignant assigné avec succès.');
      this.loadData();
    } catch (error) {
      this.notificationService.error("Échec de l'assignation.");
    }
  }

  /** Ajouter un cours spécifique manuellement (POST Hybrid) */
  async onAddManualTeaching() {
    if (this.manualForm.invalid) return;

    try {
      await firstValueFrom(this.academicService.addTeachingToClass(this.data.schoolClass.id, this.manualForm.value));
      this.notificationService.success('Cours manuel ajouté à la classe.');
      this.isAddingManual.set(false);
      this.manualForm.reset({coefficient: 1, maxScore: 20});
      this.loadData();
    } catch (error) {
      this.notificationService.error("Échec de l'ajout manuel.");
    }
  }

  /** Retirer un enseignement */
  async confirmRemove(t: Teaching) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Retirer cet enseignement ?',
        message: `Voulez-vous retirer "${t.subjectName}" de cette classe ?`,
        confirmLabel: 'Oui, retirer',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (confirmed) {
        try {
          await firstValueFrom(this.academicService.removeTeachingFromClass(this.data.schoolClass.id, t.id));
          this.notificationService.success('Enseignement retiré.');
          this.loadData();
        } catch (error) {
          this.notificationService.error("Impossible de retirer ce cours.");
        }
      }
    });
  }

  close() {
    this.dialogRef.close();
  }
}
