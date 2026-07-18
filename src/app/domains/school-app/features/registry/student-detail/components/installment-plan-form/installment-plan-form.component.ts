import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {CalendarClock, Info, Layers, LucideAngularModule} from 'lucide-angular';
import {firstValueFrom} from 'rxjs';
import {BillingService} from '../../../../../../../core/services/billing.service';
import {AcademicService} from '../../../../../../../core/services/academic.service';
import {NotificationService} from '../../../../../../../shared/services/notification.service';
import {FormShellComponent} from '../../../../../../../shared/components/form-shell/form-shell';
import {FeeType} from '../../../../../../../core/models/billing.model';

export interface InstallmentPlanFormDialogData {
  studentId: string;
  studentName: string;
  feeTypes: FeeType[];
}

@Component({
  selector: 'app-installment-plan-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, LucideAngularModule, FormShellComponent],
  templateUrl: './installment-plan-form.component.html',
  styleUrls: ['./installment-plan-form.component.scss']
})
export class InstallmentPlanFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<InstallmentPlanFormComponent>);
  private billingService = inject(BillingService);
  private academicService = inject(AcademicService);
  private notificationService = inject(NotificationService);
  dialogData: InstallmentPlanFormDialogData = inject(MAT_DIALOG_DATA);

  readonly Layers = Layers;
  readonly CalendarClock = CalendarClock;
  readonly Info = Info;

  planForm: FormGroup = this.fb.group({
    feeTypeCode: ['', [Validators.required]],
    totalAmount: [null, [Validators.required, Validators.min(1)]],
    installmentCount: [3, [Validators.required, Validators.min(2)]],
    firstDueDate: ['', [Validators.required]],
    intervalDays: [30, [Validators.required, Validators.min(0)]]
  });

  isLoading = signal(false);

  // Résolue silencieusement au chargement (année en cours) — pas de sélecteur, cf. spec BL-BILL-06.
  private academicYearId: string | null = null;

  async ngOnInit() {
    const defaultCode = this.dialogData.feeTypes[0]?.code ?? '';
    this.planForm.patchValue({feeTypeCode: defaultCode});

    try {
      const year = await firstValueFrom(this.academicService.getCurrentYear());
      this.academicYearId = year.id;
    } catch {
      // Notification déjà affichée par AcademicService le cas échéant ; onSave bloquera si null.
    }
  }

  async onSave() {
    if (this.planForm.invalid) {
      this.planForm.markAllAsTouched();
      return;
    }
    if (!this.academicYearId) {
      this.notificationService.error('Impossible de déterminer l\'année scolaire en cours.');
      return;
    }

    const raw = this.planForm.value;
    this.isLoading.set(true);
    try {
      const tranches = await firstValueFrom(this.billingService.createInstallmentPlan(this.dialogData.studentId, {
        feeTypeCode: raw.feeTypeCode,
        academicYearId: this.academicYearId,
        totalAmount: raw.totalAmount,
        installmentCount: raw.installmentCount,
        firstDueDate: raw.firstDueDate,
        intervalDays: raw.intervalDays
      }));
      this.notificationService.success(`${tranches.length} tranches créées.`);
      this.dialogRef.close(true);
    } catch {
      // Notification déjà affichée par BillingService.handleError
    } finally {
      this.isLoading.set(false);
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  isInvalid(controlName: string): boolean {
    const control = this.planForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
