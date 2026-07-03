import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {AlertCircle, Calendar, Clock, LucideAngularModule} from 'lucide-angular';
import {firstValueFrom} from 'rxjs';
import {FormShellComponent} from '../../../../../../../shared/components/form-shell/form-shell';
import {AcademicService} from '../../../../../../../core/services/academic.service';
import {NotificationService} from '../../../../../../../shared/services/notification.service';
import {AcademicYear, Period} from '../../../../../../../core/models/academic.model';

@Component({
  selector: 'app-period-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, LucideAngularModule, FormShellComponent],
  templateUrl: './period-form.component.html',
  styleUrls: ['./period-form.component.scss']
})
export class PeriodFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<PeriodFormComponent>);
  private academicService = inject(AcademicService);
  private notificationService = inject(NotificationService);
  private data: { year: AcademicYear; period?: Period } = inject(MAT_DIALOG_DATA);

  readonly Calendar = Calendar;
  readonly Clock = Clock;
  readonly AlertCircle = AlertCircle;

  periodForm: FormGroup = this.fb.group({
    label: ['', [Validators.required, Validators.minLength(2)]],
    startDate: ['', [Validators.required]],
    endDate: ['', [Validators.required]],
    examStartDate: [''],
    examEndDate: [''],
    gradingDeadline: ['']
  });

  isLoading = signal(false);
  isEditMode = !!this.data.period;

  ngOnInit() {
    if (this.data.period) {
      this.periodForm.patchValue({
        label: this.data.period.label,
        startDate: this.data.period.startDate,
        endDate: this.data.period.endDate,
        examStartDate: this.data.period.examStartDate || '',
        examEndDate: this.data.period.examEndDate || '',
        gradingDeadline: this.data.period.gradingDeadline || ''
      });
    }
  }

  year() { return this.data.year; }

  async onSave() {
    if (this.periodForm.invalid) {
      this.periodForm.markAllAsTouched();
      return;
    }
    const val = this.periodForm.value;
    if (new Date(val.startDate) >= new Date(val.endDate)) {
      this.notificationService.error("La date de fin doit être après le début.");
      return;
    }

    const payload: any = {
      academicYearId: this.data.year.id,
      label: val.label,
      startDate: val.startDate,
      endDate: val.endDate
    };
    if (val.examStartDate) payload.examStartDate = val.examStartDate;
    if (val.examEndDate) payload.examEndDate = val.examEndDate;
    if (val.gradingDeadline) payload.gradingDeadline = val.gradingDeadline;

    this.isLoading.set(true);
    try {
      if (this.isEditMode && this.data.period) {
        await firstValueFrom(this.academicService.updatePeriod(this.data.year.id, this.data.period.id, payload));
      } else {
        await firstValueFrom(this.academicService.createPeriod(this.data.year.id, payload));
      }
      this.notificationService.success(this.isEditMode ? 'Période mise à jour.' : 'Période créée.');
      this.dialogRef.close(true);
    } catch {
      // Notification gérée par AcademicService.handleError
    } finally {
      this.isLoading.set(false);
    }
  }

  onCancel() { this.dialogRef.close(false); }

  isInvalid(name: string): boolean {
    const c = this.periodForm.get(name);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }
}
