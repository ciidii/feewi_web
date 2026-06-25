import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatSelectModule} from '@angular/material/select';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatNativeDateModule} from '@angular/material/core';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {AlertCircle, Calendar, Clock, Hash, Info, LucideAngularModule, Type} from 'lucide-angular';
import {AcademicService} from '../../../../../../../core/services/academic.service';
import {NotificationService} from '../../../../../../../shared/services/notification.service';
import {FormShellComponent} from '../../../../../../../shared/components/form-shell/form-shell';
import {firstValueFrom} from 'rxjs';

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
    MatFormFieldModule,
    MatInputModule,
    LucideAngularModule,
    FormShellComponent
  ],
  templateUrl: './year-form.component.html',
  styleUrls: ['./year-form.component.scss']
})
export class YearFormComponent implements OnInit {
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
    startDate: [null, [Validators.required]],
    endDate: [null, [Validators.required]]
  });

  isLoading = signal(false);

  ngOnInit() {
    // Auto-génération du libellé basé sur les dates
    this.yearForm.valueChanges.subscribe(val => {
      if (val.startDate && val.endDate && !this.yearForm.get('label')?.dirty) {
        const startYear = new Date(val.startDate).getFullYear();
        const endYear = new Date(val.endDate).getFullYear();
        if (startYear && endYear && startYear < endYear) {
          this.yearForm.patchValue({ label: `${startYear}-${endYear}` }, { emitEvent: false });
        }
      }
    });
  }

  async onSave() {
    if (this.yearForm.invalid) {
      this.yearForm.markAllAsTouched();
      return;
    }

    const { label, systemType, startDate, endDate } = this.yearForm.getRawValue();
    
    // Conversion en ISO string pour le backend
    const payload = {
      label,
      systemType,
      startDate: this.formatToISO(startDate),
      endDate: this.formatToISO(endDate)
    };

    if (new Date(payload.startDate) >= new Date(payload.endDate)) {
      this.notificationService.error("La date de fin doit être après le début.");
      return;
    }

    this.isLoading.set(true);
    try {
      await firstValueFrom(this.academicService.createYear(payload));
      this.notificationService.success('La rentrée a été planifiée avec succès.');
      this.dialogRef.close(true);
    } catch (error) {
      this.notificationService.error("Erreur lors de la planification de l'année.");
    } finally {
      this.isLoading.set(false);
    }
  }

  private formatToISO(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    d.setHours(12, 0, 0, 0); // Évite les problèmes de timezone
    return d.toISOString().split('T')[0];
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  isInvalid(controlName: string): boolean {
    const control = this.yearForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
