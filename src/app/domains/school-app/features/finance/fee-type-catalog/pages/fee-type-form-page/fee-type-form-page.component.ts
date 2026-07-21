import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {ArrowLeft, ChevronRight, CreditCard, GraduationCap, Info, Layers, LucideAngularModule, Plus, Power, Receipt, Tag, Trash2, Type, Wallet} from 'lucide-angular';
import type {LucideIconData} from 'lucide-angular';
import {firstValueFrom} from 'rxjs';
import {BillingService} from '../../../../../../../core/services/billing.service';
import {AcademicService} from '../../../../../../../core/services/academic.service';
import {NotificationService} from '../../../../../../../shared/services/notification.service';
import {BillingSchedule, FeeType, PriceShape} from '../../../../../../../core/models/billing.model';
import {Level} from '../../../../../../../core/models/academic.model';
import {FwPageShellComponent} from '../../../../../../../shared/components/page-shell/page-shell.component';
import {FwButtonComponent} from '../../../../../../../shared/components/button/button.component';
import {FwAlertBannerComponent} from '../../../../../../../shared/components/alert-banner/alert-banner.component';
import {BlockLoaderComponent} from '../../../../../../../shared/components/loader/block-loader.component';

/** Modèle prêt à remplir (ADR-012 §3) : préfixe (priceShape, billingSchedule). */
interface FeeTypePreset {
  id: string;
  title: string;
  description: string;
  icon: LucideIconData;
  priceShape: PriceShape;
  billingSchedule: BillingSchedule;
  suggestedCode?: string;
}

const LIST_URL = ['/admin/finance/fee-types'];

@Component({
  selector: 'app-fee-type-form-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    FwPageShellComponent,
    FwButtonComponent,
    FwAlertBannerComponent,
    BlockLoaderComponent
  ],
  templateUrl: './fee-type-form-page.component.html',
  styleUrls: ['./fee-type-form-page.component.scss']
})
export class FeeTypeFormPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private billingService = inject(BillingService);
  private academicService = inject(AcademicService);
  private notificationService = inject(NotificationService);

  // Icônes
  readonly CreditCard = CreditCard;
  readonly Type = Type;
  readonly Tag = Tag;
  readonly Info = Info;
  readonly Power = Power;
  readonly Wallet = Wallet;
  readonly Plus = Plus;
  readonly Trash2 = Trash2;
  readonly ArrowLeft = ArrowLeft;
  readonly ChevronRight = ChevronRight;
  readonly GraduationCap = GraduationCap;

  readonly presets: FeeTypePreset[] = [
    {id: 'SCOLARITE', title: 'Scolarité par niveau', description: 'Montant annuel par niveau, étalé sur les mensualités.', icon: GraduationCap, priceShape: 'PER_LEVEL', billingSchedule: 'SPREAD_ANNUAL', suggestedCode: 'SCOLARITE'},
    {id: 'INSCRIPTION', title: 'Inscription / Réinscription par niveau', description: 'Frais par niveau, facturé une fois à l\'admission.', icon: Receipt, priceShape: 'PER_LEVEL', billingSchedule: 'ONE_OFF', suggestedCode: 'INSCRIPTION'},
    {id: 'SERVICE', title: 'Service par formule / zone', description: 'Cantine, transport… tarifé par formule ou zone.', icon: Layers, priceShape: 'PER_OPTION', billingSchedule: 'SPREAD_ANNUAL'},
    {id: 'PONCTUEL', title: 'Frais ponctuel', description: 'Montant simple : forfait unique ou frais à la demande.', icon: Wallet, priceShape: 'FLAT', billingSchedule: 'ON_DEMAND'}
  ];

  feeTypeForm: FormGroup = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9_]+$/)]],
    label: ['', [Validators.required, Validators.minLength(2)]],
    active: [true],
    priceShape: [null as PriceShape | null, [Validators.required]],
    billingSchedule: [null as BillingSchedule | null, [Validators.required]],
    defaultAmount: [null, [Validators.min(1)]],
    options: this.fb.array([]),
    levelPrices: this.fb.array([])
  });

  isLoading = signal(false);
  isPageLoading = signal(false);
  isEditMode = signal(false);
  private editingId = signal<string | null>(null);
  levels = signal<Level[]>([]);
  selectedPreset = signal<FeeTypePreset | null>(null);

  showForm = computed<boolean>(() => this.isEditMode() || this.selectedPreset() !== null);

  get pageTitle(): string {
    return this.isEditMode() ? 'Modifier le type de frais' : 'Nouveau type de frais';
  }

  get saveLabel(): string {
    return this.isEditMode() ? 'Enregistrer' : 'Créer le type de frais';
  }

  get optionsArray(): FormArray {
    return this.feeTypeForm.get('options') as FormArray;
  }

  get levelPricesArray(): FormArray {
    return this.feeTypeForm.get('levelPrices') as FormArray;
  }

  get priceShape(): PriceShape | null {
    return this.feeTypeForm.get('priceShape')?.value ?? null;
  }

  get billingSchedule(): BillingSchedule | null {
    return this.feeTypeForm.get('billingSchedule')?.value ?? null;
  }

  get scheduleChoices(): {value: BillingSchedule; label: string}[] {
    if (this.priceShape === 'PER_OPTION') {
      return [{value: 'SPREAD_ANNUAL', label: 'Étalé sur l\'année'}, {value: 'ONE_OFF', label: 'Forfait à l\'admission'}];
    }
    if (this.priceShape === 'FLAT') {
      return [{value: 'ON_DEMAND', label: 'À la demande (saisie manuelle)'}, {value: 'ONE_OFF', label: 'Forfait auto à l\'admission'}];
    }
    return [];
  }

  get natureLabel(): string {
    switch (this.priceShape) {
      case 'PER_LEVEL': return this.billingSchedule === 'SPREAD_ANNUAL' ? 'Scolarité par niveau' : 'Inscription / Réinscription par niveau';
      case 'PER_OPTION': return 'Service par formule / zone';
      case 'FLAT': return 'Frais ponctuel';
      default: return '';
    }
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return; // création

    this.isEditMode.set(true);
    this.editingId.set(id);
    this.isPageLoading.set(true);
    try {
      const all = await firstValueFrom(this.billingService.getFeeTypes(true));
      const feeType = all.find(f => f.id === id);
      if (!feeType) {
        this.notificationService.error('Type de frais introuvable.');
        this.router.navigate(LIST_URL);
        return;
      }
      this.patchForEdit(feeType);
    } catch {
      this.router.navigate(LIST_URL);
    } finally {
      this.isPageLoading.set(false);
    }
  }

  private patchForEdit(feeType: FeeType) {
    this.feeTypeForm.patchValue({
      code: feeType.code,
      label: feeType.label,
      active: feeType.active,
      priceShape: feeType.priceShape,
      billingSchedule: feeType.billingSchedule,
      defaultAmount: feeType.defaultAmount
    });
    // Code et priceShape verrouillés une fois le type créé (ADR-012 §3).
    this.feeTypeForm.get('code')?.disable();
    this.feeTypeForm.get('priceShape')?.disable();

    if (feeType.priceShape === 'PER_LEVEL') {
      this.loadLevelsAndBuildGrid(feeType.options ?? []);
    } else if (feeType.priceShape === 'PER_OPTION') {
      (feeType.options ?? []).forEach(opt => this.addOption(opt));
    }
  }

  selectPreset(preset: FeeTypePreset) {
    this.selectedPreset.set(preset);
    this.feeTypeForm.patchValue({priceShape: preset.priceShape, billingSchedule: preset.billingSchedule});
    if (preset.suggestedCode && !this.feeTypeForm.get('code')?.value) {
      this.feeTypeForm.get('code')?.setValue(preset.suggestedCode);
    }
    this.optionsArray.clear();
    this.levelPricesArray.clear();
    if (preset.priceShape === 'PER_LEVEL') {
      this.loadLevelsAndBuildGrid([]);
    } else if (preset.priceShape === 'PER_OPTION') {
      this.addOption();
    }
  }

  changePreset() {
    this.selectedPreset.set(null);
    this.feeTypeForm.patchValue({priceShape: null, billingSchedule: null, defaultAmount: null});
    this.optionsArray.clear();
    this.levelPricesArray.clear();
  }

  setSchedule(schedule: BillingSchedule) {
    this.feeTypeForm.get('billingSchedule')?.setValue(schedule);
  }

  private async loadLevelsAndBuildGrid(existing: {code: string; label: string; price: number}[]) {
    const levels = await firstValueFrom(this.academicService.getLevels());
    this.levels.set(levels);
    const priceByLevel = new Map(existing.map(o => [o.code, o.price]));
    this.levelPricesArray.clear();
    levels.forEach(level => {
      this.levelPricesArray.push(this.fb.group({
        levelId: [level.id],
        levelName: [level.name],
        price: [priceByLevel.get(level.id) ?? null, [Validators.min(1)]]
      }));
    });
  }

  addOption(option?: {code: string; label: string; price: number}) {
    this.optionsArray.push(this.fb.group({
      code: [option?.code ?? '', [Validators.required]],
      label: [option?.label ?? '', [Validators.required]],
      price: [option?.price ?? null, [Validators.required, Validators.min(1)]]
    }));
  }

  removeOption(index: number) {
    this.optionsArray.removeAt(index);
  }

  get pricedLevelCount(): number {
    return this.levelPricesArray.controls.filter(c => {
      const p = c.get('price')?.value;
      return p != null && Number(p) > 0;
    }).length;
  }

  async onSave() {
    if (this.feeTypeForm.invalid) {
      this.feeTypeForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    try {
      const shape = this.priceShape;
      const schedule = this.billingSchedule!;
      let defaultAmount: number | null = null;
      let options: {code: string; label: string; price: number}[] | undefined;

      if (shape === 'FLAT') {
        const raw = this.feeTypeForm.value.defaultAmount;
        defaultAmount = raw === '' || raw === null || raw === undefined ? null : Number(raw);
        options = [];
      } else if (shape === 'PER_OPTION') {
        options = this.optionsArray.value.map((o: {code: string; label: string; price: number}) => ({
          code: o.code, label: o.label, price: Number(o.price)
        }));
      } else if (shape === 'PER_LEVEL') {
        options = this.levelPricesArray.controls
          .map(c => c.value as {levelId: string; levelName: string; price: number | null})
          .filter(v => v.price != null && Number(v.price) > 0)
          .map(v => ({code: v.levelId, label: v.levelName, price: Number(v.price)}));
      }

      const editId = this.editingId();
      if (this.isEditMode() && editId) {
        await firstValueFrom(this.billingService.updateFeeType(editId, {
          label: this.feeTypeForm.value.label,
          active: this.feeTypeForm.value.active,
          billingSchedule: schedule,
          defaultAmount,
          options
        }));
        this.notificationService.success('Le type de frais a été mis à jour.');
        this.router.navigate(['/admin/finance/fee-types', editId]);
      } else {
        const created = await firstValueFrom(this.billingService.createFeeType({
          code: this.feeTypeForm.value.code,
          label: this.feeTypeForm.value.label,
          priceShape: shape!,
          billingSchedule: schedule,
          defaultAmount,
          options
        }));
        this.notificationService.success('Le type de frais a été ajouté au catalogue.');
        this.router.navigate(['/admin/finance/fee-types', created.id]);
      }
    } catch {
      // Notification déjà affichée par BillingService.handleError
    } finally {
      this.isLoading.set(false);
    }
  }

  onCancel() {
    const editId = this.editingId();
    if (this.isEditMode() && editId) {
      this.router.navigate(['/admin/finance/fee-types', editId]);
    } else {
      this.router.navigate(LIST_URL);
    }
  }

  isInvalid(controlName: string): boolean {
    const control = this.feeTypeForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
