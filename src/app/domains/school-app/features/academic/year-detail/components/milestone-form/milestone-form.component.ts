import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule, formatDate} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatSelectModule} from '@angular/material/select';
import {AlertCircle, Calendar, Clock, Info, LucideAngularModule, Type} from 'lucide-angular';
import {AcademicService} from '../../../../../../../../core/services/academic.service';
import {NotificationService} from '../../../../../../../../shared/services/notification.service';
import {FormShellComponent} from '../../../../../../../../shared/components/form-shell/form-shell';
import {AcademicMilestone, AcademicYear, MilestoneType} from '../../../../../../../../core/models/academic.model';
import {firstValueFrom} from 'rxjs';

@Component({
  selector: 'app-milestone-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatSelectModule,
    LucideAngularModule,
    FormShellComponent
  ],
  templateUrl: './milestone-form.component.html',
  styleUrls: ['./milestone-form.component.scss']
})
export class MilestoneFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<MilestoneFormComponent>);
  private academicService = inject(AcademicService);
  private notificationService = inject(NotificationService);
  private data: { year: AcademicYear; milestone?: AcademicMilestone } = inject(MAT_DIALOG_DATA);

  // Icons
  readonly Calendar = Calendar;
  readonly Type = Type;
  readonly Info = Info;
  readonly Clock = Clock;
  readonly AlertCircle = AlertCircle;

  milestoneForm: FormGroup = this.fb.group({
    type: ['LESSONS', [Validators.required]],
    label: ['', [Validators.required, Validators.minLength(3)]],
    startDate: ['', [Validators.required]],
    endDate: ['', [Validators.required]]
  });

  isLoading = signal(false);
  isEditMode = !!this.data.milestone;

  readonly milestoneTypes: { value: MilestoneType; label: string; icon: any }[] = [
    { value: 'LESSONS', label: 'Cours & Enseignements', icon: Clock },
    { value: 'ENROLLMENT', label: 'Campagne d\'Admission', icon: Calendar },
    { value: 'RE_ENROLLMENT', label: 'Réinscriptions', icon: Calendar },
    { value: 'EXAMS', label: 'Sessions d\'Examens', icon: AlertCircle },
    { value: 'VACATION', label: 'Vacances & Congés', icon: Calendar }
  ];

  ngOnInit() {
    if (this.data.milestone) {
      this.milestoneForm.patchValue({
        type: this.data.milestone.type,
        label: this.data.milestone.label,
        startDate: this.data.milestone.startDate,
        endDate: this.data.milestone.endDate
      });
    }
  }

  year() { return this.data.year; }

  async onSave() {
    if (this.milestoneForm.invalid) {
      this.milestoneForm.markAllAsTouched();
      return;
    }

    const { startDate, endDate } = this.milestoneForm.value;
    if (new Date(startDate) >= new Date(endDate)) {
      this.notificationService.error("La date de fin doit être après le début.");
      return;
    }

    this.isLoading.set(true);
    try {
      if (this.isEditMode) {
        // Le backend V2 ne propose pas encore d'update explicite par jalon, 
        // on suit le pattern delete + create ou on attend l'endpoint PUT.
        // Pour l'instant, on simule l'ajout.
        await firstValueFrom(this.academicService.createMilestone(this.data.year.id, this.milestoneForm.value));
      } else {
        await firstValueFrom(this.academicService.createMilestone(this.data.year.id, this.milestoneForm.value));
      }
      this.notificationService.success('Calendrier mis à jour.');
      this.dialogRef.close(true);
    } catch (error) {
      this.notificationService.error("Erreur lors de l'enregistrement du jalon.");
    } finally {
      this.isLoading.set(false);
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  isInvalid(controlName: string): boolean {
    const control = this.milestoneForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
