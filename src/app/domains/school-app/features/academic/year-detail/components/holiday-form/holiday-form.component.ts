import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {AlertCircle, Calendar, Clock, LucideAngularModule} from 'lucide-angular';
import {firstValueFrom} from 'rxjs';
import {FormShellComponent} from '../../../../../../../shared/components/form-shell/form-shell';
import {AcademicService} from '../../../../../../../core/services/academic.service';
import {NotificationService} from '../../../../../../../shared/services/notification.service';
import {AcademicYear, Holiday} from '../../../../../../../core/models/academic.model';

@Component({
  selector: 'app-holiday-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, LucideAngularModule, FormShellComponent],
  templateUrl: './holiday-form.component.html',
  styleUrls: ['./holiday-form.component.scss']
})
export class HolidayFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<HolidayFormComponent>);
  private academicService = inject(AcademicService);
  private notificationService = inject(NotificationService);
  private data: { year: AcademicYear; holiday?: Holiday } = inject(MAT_DIALOG_DATA);

  readonly Calendar = Calendar;
  readonly Clock = Clock;
  readonly AlertCircle = AlertCircle;

  holidayForm: FormGroup = this.fb.group({
    label: ['', [Validators.required, Validators.minLength(2)]],
    startDate: ['', [Validators.required]],
    endDate: ['', [Validators.required]],
    schoolClosed: [false]
  });

  isLoading = signal(false);
  isEditMode = !!this.data.holiday;

  ngOnInit() {
    if (this.data.holiday) {
      this.holidayForm.patchValue({
        label: this.data.holiday.label,
        startDate: this.data.holiday.startDate,
        endDate: this.data.holiday.endDate,
        schoolClosed: this.data.holiday.schoolClosed
      });
    }
  }

  year() { return this.data.year; }

  async onSave() {
    if (this.holidayForm.invalid) {
      this.holidayForm.markAllAsTouched();
      return;
    }
    const val = this.holidayForm.value;
    if (new Date(val.startDate) > new Date(val.endDate)) {
      this.notificationService.error("La date de fin doit être après le début.");
      return;
    }

    this.isLoading.set(true);
    try {
      if (this.isEditMode && this.data.holiday) {
        await firstValueFrom(this.academicService.updateHoliday(this.data.year.id, this.data.holiday.id, val));
      } else {
        await firstValueFrom(this.academicService.createHoliday(this.data.year.id, val));
      }
      this.notificationService.success(this.isEditMode ? 'Congé mis à jour.' : 'Congé ajouté.');
      this.dialogRef.close(true);
    } catch {
      // Notification gérée par AcademicService.handleError
    } finally {
      this.isLoading.set(false);
    }
  }

  onCancel() { this.dialogRef.close(false); }

  isInvalid(name: string): boolean {
    const c = this.holidayForm.get(name);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }
}
