import {Component, inject, LOCALE_ID, OnInit, signal} from '@angular/core';
import {CommonModule, formatDate} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatSelectModule} from '@angular/material/select';
import {
  AlertCircle,
  Calendar,
  Clock,
  Info,
  LucideAngularModule,
  Palmtree,
  ShieldCheck,
  Type,
  XCircle
} from 'lucide-angular';
import {firstValueFrom} from 'rxjs';
import {AcademicService} from '../../../../../../../core/services/academic.service';
import {NotificationService} from '../../../../../../../shared/services/notification.service';
import {AcademicYear, Holiday} from '../../../../../../../core/models/academic.model';
import {FormShellComponent} from '../../../../../../../shared/components/form-shell/form-shell';
import {MatSlideToggle} from '@angular/material/slide-toggle';

@Component({
  selector: 'app-holiday-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatSelectModule,
    LucideAngularModule,
    FormShellComponent,
    MatSlideToggle
  ],
  templateUrl: './holiday-form.component.html',
  styleUrls: ['./holiday-form.component.scss']
})
export class HolidayFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<HolidayFormComponent>);
  private academicService = inject(AcademicService);
  private notificationService = inject(NotificationService);
  private data: { year: AcademicYear; holiday?: Holiday } = inject(MAT_DIALOG_DATA);
  private locale = inject(LOCALE_ID);

  // Icônes
  readonly Palmtree = Palmtree;
  readonly Type = Type;
  readonly Info = Info;
  readonly Clock = Clock;
  readonly AlertCircle = AlertCircle;

  holidayForm: FormGroup = this.fb.group({
    label: ['', [Validators.required, Validators.minLength(3)]],
    startDate: ['', [Validators.required]],
    endDate: ['', [Validators.required]],
    schoolClosed: [true]
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

    this.isLoading.set(true);
    try {
      if (this.isEditMode) {
        await firstValueFrom(this.academicService.updateHoliday(this.data.year.id, this.data.holiday!.id, this.holidayForm.value));
      } else {
        await firstValueFrom(this.academicService.createHoliday(this.data.year.id, this.holidayForm.value));
      }
      this.notificationService.success(this.isEditMode ? 'Congé mis à jour.' : 'Congé ajouté au calendrier.');
      this.dialogRef.close(true);
    } catch (error) {
      this.notificationService.error("Erreur lors de l'enregistrement du congé.");
    } finally {
      this.isLoading.set(false);
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  isInvalid(controlName: string): boolean {
    const control = this.holidayForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  formatDate(date?: string): string {
    if (!date) return '—';
    return formatDate(date, 'd MMMM yyyy', this.locale);
  }

  protected readonly XCircle = XCircle;
  protected readonly Calendar = Calendar;
  protected readonly ShieldCheck = ShieldCheck;
}
