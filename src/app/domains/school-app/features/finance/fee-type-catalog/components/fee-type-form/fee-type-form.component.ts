import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatSelectModule} from '@angular/material/select';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {CreditCard, Info, LucideAngularModule, Plus, Power, Tag, Trash2, Type, Wallet} from 'lucide-angular';
import {firstValueFrom} from 'rxjs';
import {BillingService} from '../../../../../../../core/services/billing.service';
import {AcademicService} from '../../../../../../../core/services/academic.service';
import {NotificationService} from '../../../../../../../shared/services/notification.service';
import {FeeType} from '../../../../../../../core/models/billing.model';
import {Level} from '../../../../../../../core/models/academic.model';
import {FormShellComponent} from '../../../../../../../shared/components/form-shell/form-shell';
import {FwButtonComponent} from '../../../../../../../shared/components/button/button.component';

export interface FeeTypeFormDialogData {
  feeType?: FeeType;
}

/** Code réservé (ADR-009 §2) : ses options se résolvent par niveau (levelId), pas par texte libre. */
const CODE_SCOLARITE = 'SCOLARITE';

@Component({
  selector: 'app-fee-type-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatSelectModule,
    LucideAngularModule,
    FormShellComponent,
    FwButtonComponent
  ],
  templateUrl: './fee-type-form.component.html',
  styleUrls: ['./fee-type-form.component.scss']
})
export class FeeTypeFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<FeeTypeFormComponent>);
  private billingService = inject(BillingService);
  private academicService = inject(AcademicService);
  private notificationService = inject(NotificationService);
  private dialogData: FeeTypeFormDialogData | null = inject(MAT_DIALOG_DATA, {optional: true});

  // Icônes
  readonly CreditCard = CreditCard;
  readonly Type = Type;
  readonly Tag = Tag;
  readonly Info = Info;
  readonly Power = Power;
  readonly Wallet = Wallet;
  readonly Plus = Plus;
  readonly Trash2 = Trash2;

  feeTypeForm: FormGroup = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9_]+$/)]],
    label: ['', [Validators.required, Validators.minLength(2)]],
    active: [true],
    /** Mode de tarification : 'amount' (montant unique, defaultAmount) ou 'options' (catalogue). */
    pricingMode: ['amount'],
    defaultAmount: [null, [Validators.min(1)]],
    options: this.fb.array([])
  });

  isLoading = signal(false);
  isEditMode = !!this.dialogData?.feeType;
  levels = signal<Level[]>([]);

  get optionsArray(): FormArray {
    return this.feeTypeForm.get('options') as FormArray;
  }

  /** Le code est verrouillé en édition — on peut donc savoir dès l'affichage si c'est SCOLARITE. */
  get isScolarite(): boolean {
    const code = this.isEditMode ? this.dialogData?.feeType?.code : this.feeTypeForm.get('code')?.value;
    return code === CODE_SCOLARITE;
  }

  get pricingMode(): string {
    return this.feeTypeForm.get('pricingMode')?.value;
  }

  ngOnInit() {
    if (this.isEditMode && this.dialogData?.feeType) {
      const feeType = this.dialogData.feeType;
      this.feeTypeForm.patchValue({
        code: feeType.code,
        label: feeType.label,
        active: feeType.active,
        defaultAmount: feeType.defaultAmount,
        pricingMode: feeType.options?.length ? 'options' : 'amount'
      });
      (feeType.options ?? []).forEach(opt => this.addOption(opt));
      // Le code n'est jamais modifiable une fois le type créé (système ou personnalisé).
      this.feeTypeForm.get('code')?.disable();
    }

    if (this.isScolarite) {
      this.loadLevels();
    }
  }

  private async loadLevels() {
    this.levels.set(await firstValueFrom(this.academicService.getLevels()));
  }

  onCodeChanged() {
    // Le champ code n'est éditable qu'en création — si l'utilisateur tape "SCOLARITE",
    // on charge les niveaux pour que le sélecteur d'option soit prêt.
    if (this.isScolarite && this.levels().length === 0) {
      this.loadLevels();
    }
  }

  setPricingMode(mode: 'amount' | 'options') {
    this.feeTypeForm.get('pricingMode')?.setValue(mode);
  }

  addOption(option?: { code: string; label: string; price: number }) {
    this.optionsArray.push(this.fb.group({
      code: [option?.code ?? '', [Validators.required]],
      label: [option?.label ?? '', [Validators.required]],
      price: [option?.price ?? null, [Validators.required, Validators.min(1)]]
    }));
  }

  removeOption(index: number) {
    this.optionsArray.removeAt(index);
  }

  /** Libellé du niveau déjà sélectionné pour une ligne d'option — évite un lookup en template. */
  levelLabelFor(levelId: string): string {
    return this.levels().find(l => l.id === levelId)?.name ?? levelId;
  }

  async onSave() {
    if (this.feeTypeForm.invalid) {
      this.feeTypeForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    try {
      // N'envoyer que les champs du mode actif — ADR-009 §1 autorise la coexistence de
      // `defaultAmount`/`options` côté backend, mais un seul mode a du sens côté saisie
      // (éviter qu'un montant unique périmé traîne derrière un catalogue d'options actif).
      const rawAmount = this.feeTypeForm.value.defaultAmount;
      const defaultAmount = this.pricingMode === 'amount'
        ? (rawAmount === '' || rawAmount === null || rawAmount === undefined ? null : Number(rawAmount))
        : null;
      const options = this.pricingMode === 'options'
        ? this.optionsArray.value.map((o: { code: string; label: string; price: number }) => ({
            code: o.code, label: o.label, price: Number(o.price)
          }))
        : undefined;

      if (this.isEditMode && this.dialogData?.feeType) {
        await firstValueFrom(this.billingService.updateFeeType(this.dialogData.feeType.id, {
          label: this.feeTypeForm.value.label,
          active: this.feeTypeForm.value.active,
          defaultAmount,
          options
        }));
        this.notificationService.success('Le type de frais a été mis à jour.');
      } else {
        await firstValueFrom(this.billingService.createFeeType({
          code: this.feeTypeForm.value.code,
          label: this.feeTypeForm.value.label,
          defaultAmount,
          options
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
