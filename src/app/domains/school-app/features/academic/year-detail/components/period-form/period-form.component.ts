import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {Calendar, CheckCircle, Clock, GraduationCap, Info, ListTodo, LucideAngularModule, Type} from 'lucide-angular';
import {AcademicService} from '../../../../../../../core/services/academic.service';
import {NotificationService} from '../../../../../../../shared/services/notification.service';
import {FormShellComponent} from '../../../../../../../shared/components/form-shell/form-shell';
import {AcademicYear} from '../../../../../../../core/models/academic.model';

@Component({
  selector: 'app-period-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    LucideAngularModule,
    FormShellComponent
  ],
  templateUrl: './period-form.component.html',
  styleUrls: ['./period-form.component.scss']
})
export class PeriodFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<PeriodFormComponent>);
  private academicService = inject(AcademicService);
  private notificationService = inject(NotificationService);
  private dialogData = inject(MAT_DIALOG_DATA);

  // Icônes
  readonly ListTodo = ListTodo;
  readonly Type = Type;
  readonly Calendar = Calendar;
  readonly CheckCircle = CheckCircle;
  readonly Clock = Clock;
  readonly Info = Info;

  periodForm: FormGroup = this.fb.group({
    label: ['', [Validators.required]],
    startDate: ['', [Validators.required]],
    endDate: ['', [Validators.required]],
    examStartDate: ['', [Validators.required]],
    examEndDate: ['', [Validators.required]],
    gradingDeadline: ['', [Validators.required]]
  });

  year = signal<AcademicYear | null>(null);
  isLoading = signal(false);
  isEditMode = !!this.dialogData?.period;

  ngOnInit() {
    this.year.set(this.dialogData.year);
    if (this.isEditMode) {
      this.periodForm.patchValue(this.dialogData.period);
    }
  }

  async onSave() {
    if (this.periodForm.invalid) {
      this.periodForm.markAllAsTouched();
      return;
    }

    const y = this.year();
    if (!y) return;

    this.isLoading.set(true);
    try {
      if (this.isEditMode) {
        await this.academicService.updatePeriod(y.id, this.dialogData.period.id, this.periodForm.value);
        this.notificationService.success('La période a été mise à jour.');
      } else {
        await this.academicService.createPeriod(y.id, this.periodForm.value);
        this.notificationService.success('La période a été ajoutée au calendrier.');
      }
      this.dialogRef.close(true);
    } catch (error) {
      this.notificationService.error("Erreur lors de l'enregistrement de la période.");
    } finally {
      this.isLoading.set(false);
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  formatDate(date?: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.periodForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  protected readonly GraduationCap = GraduationCap;
}
