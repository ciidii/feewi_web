import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {
  AlertTriangle,
  CheckCircle,
  CreditCard,
  Edit,
  GraduationCap,
  Layers,
  LucideAngularModule,
  Power,
  Receipt,
  Trash2,
  XCircle,
} from 'lucide-angular';
import type {LucideIconData} from 'lucide-angular';
import {firstValueFrom} from 'rxjs';
import {AcademicService} from '../../../../../../../core/services/academic.service';
import {
  BILLING_SCHEDULE_LABELS,
  FeeType,
  PRICE_SHAPE_LABELS,
} from '../../../../../../../core/models/billing.model';
import {FwButtonComponent} from '../../../../../../../shared/components/button/button.component';

export interface FeeTypeDetailDialogData {
  feeType: FeeType;
  /** Autorise l'affichage des opérations (Modifier / Activer / Supprimer). */
  canManage: boolean;
}

/** Résultat renvoyé au catalogue, qui centralise l'exécution des opérations. */
export type FeeTypeDetailResult =
  | {action: 'edit'}
  | {action: 'delete'}
  | {action: 'toggle'; nextActive: boolean};

interface LevelPriceRow {
  levelName: string;
  price: number | null;
}

@Component({
  selector: 'app-fee-type-detail',
  standalone: true,
  imports: [CommonModule, MatDialogModule, LucideAngularModule, FwButtonComponent],
  templateUrl: './fee-type-detail.component.html',
  styleUrls: ['./fee-type-detail.component.scss'],
})
export class FeeTypeDetailComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<FeeTypeDetailComponent>);
  private academicService = inject(AcademicService);
  data: FeeTypeDetailDialogData = inject(MAT_DIALOG_DATA);

  readonly Edit = Edit;
  readonly Power = Power;
  readonly Trash2 = Trash2;
  readonly AlertTriangle = AlertTriangle;
  readonly CheckCircle = CheckCircle;
  readonly XCircle = XCircle;

  isLoadingLevels = signal(false);
  levelRows = signal<LevelPriceRow[]>([]);

  get feeType(): FeeType {
    return this.data.feeType;
  }

  get canManage(): boolean {
    return this.data.canManage;
  }

  get priceShapeLabel(): string {
    return PRICE_SHAPE_LABELS[this.feeType.priceShape];
  }

  get billingScheduleLabel(): string {
    return BILLING_SCHEDULE_LABELS[this.feeType.billingSchedule];
  }

  get natureIcon(): LucideIconData {
    switch (this.feeType.priceShape) {
      case 'PER_LEVEL':
        return GraduationCap;
      case 'PER_OPTION':
        return Layers;
      default:
        return Receipt;
    }
  }

  /** Un type système (scolarité/inscription/réinscription) ne se supprime ni ne se désactive. */
  get isSystem(): boolean {
    return !!this.feeType.isSystemDefined;
  }

  /** Nombre de niveaux réellement tarifés — pilote l'alerte « tarif non configuré ». */
  readonly configuredLevelCount = computed(() => this.levelRows().filter(r => r.price != null && r.price > 0).length);

  async ngOnInit() {
    if (this.feeType.priceShape === 'PER_LEVEL') {
      this.isLoadingLevels.set(true);
      try {
        const levels = await firstValueFrom(this.academicService.getLevels());
        const priceByLevel = new Map((this.feeType.options ?? []).map(o => [o.code, o.price]));
        this.levelRows.set(levels.map(l => ({levelName: l.name, price: priceByLevel.get(l.id) ?? null})));
      } catch {
        // Notification déjà affichée par AcademicService le cas échéant.
      } finally {
        this.isLoadingLevels.set(false);
      }
    }
  }

  onEdit() {
    this.dialogRef.close({action: 'edit'} satisfies FeeTypeDetailResult);
  }

  onDelete() {
    this.dialogRef.close({action: 'delete'} satisfies FeeTypeDetailResult);
  }

  onToggle() {
    this.dialogRef.close({action: 'toggle', nextActive: !this.feeType.active} satisfies FeeTypeDetailResult);
  }

  onClose() {
    this.dialogRef.close();
  }
}
