import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { LucideAngularModule, Palmtree, Type, Calendar, Info, AlertCircle, Home, XCircle } from 'lucide-angular';
import { AcademicService } from '../../../../../../../core/services/academic.service';
import { NotificationService } from '../../../../../../../shared/services/notification.service';
import { FormShellComponent } from '../../../../../../../shared/components/form-shell/form-shell';
import { AcademicYear, Holiday } from '../../../../../../../core/models/academic.model';

@Component({
  selector: 'app-holiday-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatSlideToggleModule,
    LucideAngularModule,
    FormShellComponent
  ],
  templateUrl: './holiday-form.component.html',
  styleUrls: ['./holiday-form.component.scss']
})
export class HolidayFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<HolidayFormComponent>);
  private academicService = inject(AcademicService);
  private notificationService = inject(NotificationService);
  private dialogData = inject(MAT_DIALOG_DATA);

  // Icônes
  readonly Palmtree = Palmtree;
  readonly Type = Type;
  readonly Calendar = Calendar;
  readonly Info = Info;
  readonly Home = Home;
  readonly XCircle = XCircle;

  holidayForm: FormGroup = this.fb.group({
    label: ['', [Validators.required, Validators.minLength(3)]],
    startDate: ['', [Validators.required]],
    endDate: ['', [Validators.required]],
    schoolClosed: [true]
  });

  year = signal<AcademicYear | null>(null);
  isLoading = signal(false);
  isEditMode = !!this.dialogData?.holiday;

  ngOnInit() {
    this.year.set(this.dialogData.year);
    if (this.isEditMode) {
      this.holidayForm.patchValue(this.dialogData.holiday);
    }
  }

  async onSave() {
    if (this.holidayForm.invalid) {
      this.holidayForm.markAllAsTouched();
      return;
    }

    const y = this.year();
    if (!y) return;

    this.isLoading.set(true);
    try {
      if (this.isEditMode) {
        await this.academicService.updateHoliday(y.id, this.dialogData.holiday.id, this.holidayForm.value);
        this.notificationService.success('Congé mis à jour.');
      } else {
        await this.academicService.createHoliday(y.id, this.holidayForm.value);
        this.notificationService.success('Congé ajouté au calendrier.');
      }
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

  formatDate(date?: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.holidayForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
