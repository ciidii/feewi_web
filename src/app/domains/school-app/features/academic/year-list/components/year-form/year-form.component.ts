import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatSelectModule} from '@angular/material/select';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatNativeDateModule} from '@angular/material/core';
import {AlertCircle, Calendar, Clock, Hash, Info, LucideAngularModule, Type} from 'lucide-angular';
import {AcademicService} from '../../../../../../../core/services/academic.service';
import {NotificationService} from '../../../../../../../shared/services/notification.service';
import {FormShellComponent} from '../../../../../../../shared/components/form-shell/form-shell';

@Component({
  selector: 'app-year-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    LucideAngularModule,
    FormShellComponent
  ],
  templateUrl: './year-form.component.html',
  styleUrls: ['./year-form.component.scss']
})
export class YearFormComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<YearFormComponent>);
  private academicService = inject(AcademicService);
  private notificationService = inject(NotificationService);

  // Icônes
  readonly Calendar = Calendar;
  readonly Type = Type;
  readonly Hash = Hash;
  readonly Info = Info;
  readonly Clock = Clock;
  readonly AlertCircle = AlertCircle;

  yearForm: FormGroup = this.fb.group({
    label: ['', [Validators.required, Validators.pattern('^20[0-9]{2}-20[0-9]{2}$')]],
    systemType: ['TRIMESTER', [Validators.required]],
    adminStartDate: ['', [Validators.required]],
    adminEndDate: ['', [Validators.required]],
    lessonsStartDate: ['', [Validators.required]],
    lessonsEndDate: ['', [Validators.required]]
  });

  isLoading = signal(false);

  async onSave() {
    if (this.yearForm.invalid) {
      this.yearForm.markAllAsTouched();
      return;
    }

    // Validation métier des dates (simplifiée ici)
    const { adminStartDate, adminEndDate, lessonsStartDate, lessonsEndDate } = this.yearForm.value;
    if (new Date(adminStartDate) >= new Date(adminEndDate)) {
      this.notificationService.error("La date de fin administrative doit être après le début.");
      return;
    }

    this.isLoading.set(true);
    try {
      await this.academicService.createYear(this.yearForm.value);
      this.notificationService.success('La rentrée a été planifiée avec succès.');
      this.dialogRef.close(true);
    } catch (error) {
      this.notificationService.error("Erreur lors de la planification de l'année.");
    } finally {
      this.isLoading.set(false);
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  isInvalid(controlName: string): boolean {
    const control = this.yearForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
