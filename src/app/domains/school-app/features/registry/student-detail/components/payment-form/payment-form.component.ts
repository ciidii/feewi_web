import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {CreditCard, FileText, Info, LucideAngularModule, StickyNote, Wallet} from 'lucide-angular';
import {firstValueFrom} from 'rxjs';
import {BillingService} from '../../../../../../../core/services/billing.service';
import {NotificationService} from '../../../../../../../shared/services/notification.service';
import {FormShellComponent} from '../../../../../../../shared/components/form-shell/form-shell';
import {FeeType, PAYMENT_METHOD_LABELS, PaymentMethod} from '../../../../../../../core/models/billing.model';

export interface PaymentFormDialogData {
  studentId: string;
  studentName: string;
  feeTypes: FeeType[];
}

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, LucideAngularModule, FormShellComponent],
  templateUrl: './payment-form.component.html',
  styleUrls: ['./payment-form.component.scss']
})
export class PaymentFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<PaymentFormComponent>);
  private billingService = inject(BillingService);
  private notificationService = inject(NotificationService);
  dialogData: PaymentFormDialogData = inject(MAT_DIALOG_DATA);

  readonly Wallet = Wallet;
  readonly CreditCard = CreditCard;
  readonly FileText = FileText;
  readonly StickyNote = StickyNote;
  readonly Info = Info;

  readonly methodOptions: { value: PaymentMethod; label: string }[] = (
    ['CASH', 'BANK_TRANSFER', 'WAVE', 'ORANGE_MONEY'] as PaymentMethod[]
  ).map(value => ({value, label: PAYMENT_METHOD_LABELS[value]}));

  paymentForm: FormGroup = this.fb.group({
    feeTypeCode: ['', [Validators.required]],
    amount: [null, [Validators.required, Validators.min(1)]],
    method: ['CASH', [Validators.required]],
    reference: [''],
    notes: ['']
  });

  isLoading = signal(false);

  ngOnInit() {
    const defaultCode = this.dialogData.feeTypes.find(f => f.code === 'INSCRIPTION')?.code
      ?? this.dialogData.feeTypes[0]?.code
      ?? '';
    this.paymentForm.patchValue({feeTypeCode: defaultCode});
  }

  async onSave() {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    const raw = this.paymentForm.value;
    this.isLoading.set(true);
    try {
      await firstValueFrom(this.billingService.recordPayment(this.dialogData.studentId, {
        feeTypeCode: raw.feeTypeCode,
        amount: raw.amount,
        method: raw.method,
        reference: raw.reference?.trim() || null,
        notes: raw.notes?.trim() || null
      }));
      this.notificationService.success('Paiement enregistré.');
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
    const control = this.paymentForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
