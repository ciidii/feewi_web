import {Component, inject, LOCALE_ID, OnInit, signal} from '@angular/core';
import {CommonModule, formatDate} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatSelectModule} from '@angular/material/select';
import {AlertCircle, Clock, Info, ListTodo, LucideAngularModule, Type} from 'lucide-angular';
import {AcademicService} from '../../../../../../../../core/services/academic.service';
import {NotificationService} from '../../../../../../../../shared/services/notification.service';
import {FormShellComponent} from '../../../../../../../../shared/components/form-shell/form-shell';
import {AcademicYear, Period} from '../../../../../../../../core/models/academic.model';
import {firstValueFrom} from 'rxjs';

@Component({
  selector: 'app-period-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatSelectModule,
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
  private data: { year: AcademicYear; period?: Period } = inject(MAT_DIALOG_DATA);
  private locale = inject(LOCALE_ID);

  // Icônes
  readonly ListTodo = ListTodo;
  readonly Type = Type;
  readonly Info = Info;
  readonly Clock = Clock;
  readonly AlertCircle = AlertCircle;

  periodForm: FormGroup = this.fb.group({
    label: ['', [Validators.required, Validators.minLength(3)]],
    startDate: ['', [Validators.required]],
    endDate: ['', [Validators.required]],
    examStartDate: ['', [Validators.required]],
    examEndDate: ['', [Validators.required]],
    gradingDeadline: ['', [Validators.required]]
  });

  isLoading = signal(false);
  isEditMode = !!this.data.period;

  ngOnInit() {
    if (this.data.period) {
      this.periodForm.patchValue({
        label: this.data.period.label,
        startDate: this.data.period.startDate,
        endDate: this.data.period.endDate,
        examStartDate: this.data.period.examStartDate,
        examEndDate: this.data.period.examEndDate,
        gradingDeadline: this.data.period.gradingDeadline
      });
    }
  }

  year() { return this.data.year; }

  async onSave() {
    if (this.periodForm.invalid) {
      this.periodForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    try {
      if (this.isEditMode) {
        await firstValueFrom(this.academicService.updatePeriod(this.data.year.id, this.data.period!.id, this.periodForm.value));
      } else {
        await firstValueFrom(this.academicService.createPeriod(this.data.year.id, this.periodForm.value));
      }
      this.notificationService.success(this.isEditMode ? 'Période mise à jour.' : 'Période ajoutée au calendrier.');
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

  isInvalid(controlName: string): boolean {
    const control = this.periodForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  formatDate(date?: string): string {
    if (!date) return '—';
    return formatDate(date, 'd MMMM yyyy', this.locale);
  }
}
