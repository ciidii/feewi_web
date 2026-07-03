import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {Layers, LucideAngularModule} from 'lucide-angular';
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

  readonly Layers = Layers;

  periodForm: FormGroup = this.fb.group({
    label: ['', [Validators.required, Validators.minLength(2)]],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required]
  });

  isLoading = signal(false);
  isEditMode = !!this.data.period;

  ngOnInit() {
    if (this.data.period) {
      this.periodForm.patchValue({
        label: this.data.period.label,
        startDate: this.data.period.startDate,
        endDate: this.data.period.endDate
      });
    }
  }

  year() { return this.data.year; }

  async onSave() {
    if (this.periodForm.invalid) { this.periodForm.markAllAsTouched(); return; }
    const val = this.periodForm.value;
    if (new Date(val.startDate) >= new Date(val.endDate)) {
      this.notificationService.error('La date de fin doit être après le début.');
      return;
    }
    this.isLoading.set(true);
    try {
      const payload = {academicYearId: this.data.year.id, ...val};
      if (this.isEditMode && this.data.period) {
        await firstValueFrom(this.academicService.updatePeriod(this.data.year.id, this.data.period.id, payload));
      } else {
        await firstValueFrom(this.academicService.createPeriod(this.data.year.id, payload));
      }
      this.notificationService.success(this.isEditMode ? 'Période mise à jour.' : 'Période créée.');
      this.dialogRef.close(true);
    } catch {
      // géré par AcademicService.handleError
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
