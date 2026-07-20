import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {CalendarClock, Info, ReceiptText, LucideAngularModule} from 'lucide-angular';
import {firstValueFrom} from 'rxjs';
import {BillingService} from '../../../../../../../core/services/billing.service';
import {AcademicService} from '../../../../../../../core/services/academic.service';
import {NotificationService} from '../../../../../../../shared/services/notification.service';
import {FormShellComponent} from '../../../../../../../shared/components/form-shell/form-shell';
import {FeeType} from '../../../../../../../core/models/billing.model';

export interface FeeItemFormDialogData {
  studentId: string;
  studentName: string;
  feeTypes: FeeType[];
}

@Component({
  selector: 'app-fee-item-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, LucideAngularModule, FormShellComponent],
  templateUrl: './fee-item-form.component.html',
  styleUrls: ['./fee-item-form.component.scss']
})
export class FeeItemFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<FeeItemFormComponent>);
  private billingService = inject(BillingService);
  private academicService = inject(AcademicService);
  private notificationService = inject(NotificationService);
  dialogData: FeeItemFormDialogData = inject(MAT_DIALOG_DATA);

  readonly ReceiptText = ReceiptText;
  readonly CalendarClock = CalendarClock;
  readonly Info = Info;

  feeItemForm: FormGroup = this.fb.group({
    feeTypeCode: ['', [Validators.required]],
    label: ['', [Validators.required]],
    amount: [null, [Validators.required, Validators.min(1)]],
    dueDate: [null]
  });

  isLoading = signal(false);

  // Résolue silencieusement au chargement (année en cours) — pas de sélecteur, cf. installment-plan-form.
  private academicYearId: string | null = null;

  async ngOnInit() {
    const defaultCode = this.dialogData.feeTypes[0]?.code ?? '';
    this.feeItemForm.patchValue({feeTypeCode: defaultCode});
    this.prefillFromFeeType(defaultCode);

    this.feeItemForm.get('feeTypeCode')?.valueChanges.subscribe((code: string) => this.prefillFromFeeType(code));

    try {
      const year = await firstValueFrom(this.academicService.getCurrentYear());
      this.academicYearId = year.id;
    } catch {
      // Notification déjà affichée par AcademicService le cas échéant ; onSave bloquera si null.
    }
  }

  /** Préremplit libellé et montant depuis le type de frais choisi — l'utilisateur reste libre de les écraser. */
  private prefillFromFeeType(code: string) {
    const feeType = this.dialogData.feeTypes.find(ft => ft.code === code);
    if (!feeType) return;
    const patch: {label?: string; amount?: number} = {};
    if (!this.feeItemForm.get('label')?.dirty) patch.label = feeType.label;
    if (!this.feeItemForm.get('amount')?.dirty && feeType.defaultAmount != null) patch.amount = feeType.defaultAmount;
    if (Object.keys(patch).length > 0) this.feeItemForm.patchValue(patch);
  }

  async onSave() {
    if (this.feeItemForm.invalid) {
      this.feeItemForm.markAllAsTouched();
      return;
    }
    if (!this.academicYearId) {
      this.notificationService.error('Impossible de déterminer l\'année scolaire en cours.');
      return;
    }

    const raw = this.feeItemForm.value;
    this.isLoading.set(true);
    try {
      await firstValueFrom(this.billingService.createFeeItem(this.dialogData.studentId, {
        feeTypeCode: raw.feeTypeCode,
        academicYearId: this.academicYearId,
        label: raw.label?.trim(),
        amount: raw.amount,
        dueDate: raw.dueDate || null
      }));
      this.notificationService.success('Frais enregistré.');
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
    const control = this.feeItemForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
