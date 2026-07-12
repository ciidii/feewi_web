import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {CreditCard, Info, LucideAngularModule, Power, Tag, Type} from 'lucide-angular';
import {firstValueFrom} from 'rxjs';
import {BillingService} from '../../../../../../../core/services/billing.service';
import {NotificationService} from '../../../../../../../shared/services/notification.service';
import {FeeType} from '../../../../../../../core/models/billing.model';
import {FormShellComponent} from '../../../../../../../shared/components/form-shell/form-shell';

export interface FeeTypeFormDialogData {
  feeType?: FeeType;
}

@Component({
  selector: 'app-fee-type-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    LucideAngularModule,
    FormShellComponent
  ],
  templateUrl: './fee-type-form.component.html',
  styleUrls: ['./fee-type-form.component.scss']
})
export class FeeTypeFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<FeeTypeFormComponent>);
  private billingService = inject(BillingService);
  private notificationService = inject(NotificationService);
  private dialogData: FeeTypeFormDialogData | null = inject(MAT_DIALOG_DATA, {optional: true});

  // Icônes
  readonly CreditCard = CreditCard;
  readonly Type = Type;
  readonly Tag = Tag;
  readonly Info = Info;
  readonly Power = Power;

  feeTypeForm: FormGroup = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9_]+$/)]],
    label: ['', [Validators.required, Validators.minLength(2)]],
    active: [true]
  });

  isLoading = signal(false);
  isEditMode = !!this.dialogData?.feeType;

  ngOnInit() {
    if (this.isEditMode && this.dialogData?.feeType) {
      this.feeTypeForm.patchValue(this.dialogData.feeType);
      // Le code n'est jamais modifiable une fois le type créé (système ou personnalisé).
      this.feeTypeForm.get('code')?.disable();
    }
  }

  async onSave() {
    if (this.feeTypeForm.invalid) {
      this.feeTypeForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    try {
      if (this.isEditMode && this.dialogData?.feeType) {
        await firstValueFrom(this.billingService.updateFeeType(this.dialogData.feeType.id, {
          label: this.feeTypeForm.value.label,
          active: this.feeTypeForm.value.active
        }));
        this.notificationService.success('Le type de frais a été mis à jour.');
      } else {
        await firstValueFrom(this.billingService.createFeeType({
          code: this.feeTypeForm.value.code,
          label: this.feeTypeForm.value.label
        }));
        this.notificationService.success('Le type de frais a été ajouté au catalogue.');
      }
      this.dialogRef.close(true);
    } catch (error) {
      // La notification d'erreur est déjà déclenchée par BillingService.handleError
    } finally {
      this.isLoading.set(false);
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  isInvalid(controlName: string): boolean {
    const control = this.feeTypeForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
