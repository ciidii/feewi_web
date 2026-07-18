import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatNativeDateModule} from '@angular/material/core';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {AlertTriangle, Ban, Calendar, LucideAngularModule} from 'lucide-angular';
import {firstValueFrom} from 'rxjs';
import {EnrollmentAdminService} from '../../../../../../../core/services/enrollment-admin.service';
import {NotificationService} from '../../../../../../../shared/services/notification.service';
import {FormShellComponent} from '../../../../../../../shared/components/form-shell/form-shell';

export interface TerminateSubscriptionDialogData {
  admissionId: string;
  serviceCode: string;
  serviceLabel: string;
}

@Component({
  selector: 'app-terminate-subscription-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    LucideAngularModule,
    FormShellComponent
  ],
  templateUrl: './terminate-subscription-dialog.component.html'
})
export class TerminateSubscriptionDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<TerminateSubscriptionDialogComponent>);
  private enrollmentAdminService = inject(EnrollmentAdminService);
  private notificationService = inject(NotificationService);
  data: TerminateSubscriptionDialogData = inject(MAT_DIALOG_DATA);

  readonly Calendar = Calendar;
  readonly Ban = Ban;
  readonly AlertTriangle = AlertTriangle;

  readonly today = new Date();

  terminateForm: FormGroup = this.fb.group({
    effectiveDate: [null, [Validators.required]],
    reason: ['']
  });

  isLoading = signal(false);

  async onSave() {
    if (this.terminateForm.invalid) {
      this.terminateForm.markAllAsTouched();
      return;
    }

    const {effectiveDate, reason} = this.terminateForm.getRawValue();

    this.isLoading.set(true);
    try {
      await firstValueFrom(this.enrollmentAdminService.terminateSubscription(
        this.data.admissionId,
        this.data.serviceCode,
        {effectiveDate: this.formatToISO(effectiveDate), reason: reason || undefined}
      ));
      this.notificationService.success(`Résiliation de "${this.data.serviceLabel}" enregistrée.`);
      this.dialogRef.close(true);
    } catch (error) {
      // La notification d'erreur est déjà déclenchée par EnrollmentAdminService.handleError
    } finally {
      this.isLoading.set(false);
    }
  }

  private formatToISO(date: any): string {
    const d = new Date(date);
    d.setHours(12, 0, 0, 0);
    return d.toISOString().split('T')[0];
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  isInvalid(controlName: string): boolean {
    const control = this.terminateForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
