import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {Loader2, LucideAngularModule, X} from 'lucide-angular';
import {SubscriptionService} from '../../../core/services/subscription.service';

export interface SubscriptionPaymentDialogData {
  schoolId: string;
  schoolName: string;
  amount: number;
  currency: string;
}

@Component({
  selector: 'app-subscription-payment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, LucideAngularModule],
  template: `
    <div class="p-6 w-[min(92vw,460px)]">
      <div class="flex items-center justify-between mb-1">
        <h2 class="text-base font-bold text-slate-900">Enregistrer un paiement</h2>
        <button type="button" (click)="close()" class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <lucide-icon [name]="X" class="w-4 h-4"></lucide-icon>
        </button>
      </div>
      <p class="text-xs text-slate-500 mb-5">Abonnement de <span class="font-bold text-slate-700">{{ data.schoolName }}</span></p>

      <form [formGroup]="form" class="space-y-4">
        <div class="space-y-1.5">
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Montant reçu ({{ data.currency }})</label>
          <input type="number" formControlName="amount" class="fw-input-clean" [class.error]="invalid('amount')"/>
          <p class="text-[10px] text-slate-400">Par défaut : le montant de la période ({{ data.amount }} {{ data.currency }}).</p>
        </div>

        <div class="space-y-1.5">
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Moyen de paiement *</label>
          <select formControlName="method" class="fw-input-clean" [class.error]="invalid('method')">
            <option value="ESPECES">Espèces</option>
            <option value="VIREMENT">Virement</option>
            <option value="MOBILE_MONEY">Mobile Money</option>
            <option value="CHEQUE">Chèque</option>
            <option value="AUTRE">Autre</option>
          </select>
        </div>
      </form>

      <div class="flex items-center justify-end gap-2 mt-6">
        <button type="button" (click)="close()" class="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800">Annuler</button>
        <button type="button" (click)="submit()" [disabled]="saving()"
                class="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-60">
          <lucide-icon *ngIf="saving()" [name]="Loader2" class="w-4 h-4 animate-spin"></lucide-icon>
          Valider le paiement
        </button>
      </div>
    </div>
  `
})
export class SubscriptionPaymentFormComponent {
  private fb = inject(FormBuilder);
  private subscriptionService = inject(SubscriptionService);
  private dialogRef = inject(MatDialogRef<SubscriptionPaymentFormComponent>);
  data = inject<SubscriptionPaymentDialogData>(MAT_DIALOG_DATA);

  readonly X = X;
  readonly Loader2 = Loader2;
  saving = signal(false);

  form = this.fb.group({
    amount: [this.data.amount, [Validators.min(0)]],
    method: ['ESPECES', Validators.required]
  });

  invalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const {amount, method} = this.form.value;
    this.subscriptionService.recordPayment(this.data.schoolId, {
      amount: amount ?? undefined,
      method: method!
    }).subscribe({
      next: (payment) => {
        this.saving.set(false);
        this.dialogRef.close(payment);
      },
      error: () => this.saving.set(false)
    });
  }

  close() {
    this.dialogRef.close(null);
  }
}
