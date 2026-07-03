import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {CalendarOff, Layers, LucideAngularModule} from 'lucide-angular';
import {firstValueFrom} from 'rxjs';
import {FormShellComponent} from '../../../../../../../shared/components/form-shell/form-shell';
import {AcademicService} from '../../../../../../../core/services/academic.service';
import {NotificationService} from '../../../../../../../shared/services/notification.service';
import {AcademicYear, CalendarEntry} from '../../../../../../../core/models/academic.model';

@Component({
  selector: 'app-calendar-entry-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, LucideAngularModule, FormShellComponent],
  templateUrl: './calendar-entry-form.component.html',
  styleUrls: ['./calendar-entry-form.component.scss']
})
export class CalendarEntryFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CalendarEntryFormComponent>);
  private academicService = inject(AcademicService);
  private notificationService = inject(NotificationService);
  private data: { year: AcademicYear; entry?: CalendarEntry } = inject(MAT_DIALOG_DATA);

  readonly Layers = Layers;
  readonly CalendarOff = CalendarOff;

  form: FormGroup = this.fb.group({
    type: ['COURS', Validators.required],
    label: ['', [Validators.required, Validators.minLength(2)]],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    schoolClosed: [false]
  });

  isLoading = signal(false);
  isEditMode = !!this.data.entry;

  get isConge(): boolean { return this.form.get('type')?.value === 'CONGE'; }

  ngOnInit() {
    if (this.data.entry) {
      this.form.patchValue({
        type: this.data.entry.type,
        label: this.data.entry.label,
        startDate: this.data.entry.startDate,
        endDate: this.data.entry.endDate,
        schoolClosed: this.data.entry.schoolClosed
      });
    }
  }

  year() { return this.data.year; }

  async onSave() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const val = this.form.value;
    if (new Date(val.startDate) >= new Date(val.endDate)) {
      this.notificationService.error('La date de fin doit être après la date de début.');
      return;
    }
    this.isLoading.set(true);
    try {
      const payload = { ...val, schoolClosed: this.isConge ? val.schoolClosed : false };
      if (this.isEditMode && this.data.entry) {
        await firstValueFrom(this.academicService.updateCalendarEntry(this.data.year.id, this.data.entry.id, payload));
      } else {
        await firstValueFrom(this.academicService.createCalendarEntry(this.data.year.id, payload));
      }
      this.notificationService.success(this.isEditMode ? 'Entrée mise à jour.' : 'Entrée ajoutée au calendrier.');
      this.dialogRef.close(true);
    } catch {
      // géré par AcademicService.handleError
    } finally {
      this.isLoading.set(false);
    }
  }

  onCancel() { this.dialogRef.close(false); }

  isInvalid(name: string): boolean {
    const c = this.form.get(name);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }
}
