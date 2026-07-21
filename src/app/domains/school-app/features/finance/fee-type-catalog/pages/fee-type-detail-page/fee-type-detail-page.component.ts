import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {AlertTriangle, CheckCircle, CreditCard, Edit, GraduationCap, Layers, LucideAngularModule, Power, Receipt, Trash2, XCircle} from 'lucide-angular';
import type {LucideIconData} from 'lucide-angular';
import {firstValueFrom} from 'rxjs';
import {BillingService} from '../../../../../../../core/services/billing.service';
import {AcademicService} from '../../../../../../../core/services/academic.service';
import {AuthService} from '../../../../../../../core/services/auth.service';
import {NotificationService} from '../../../../../../../shared/services/notification.service';
import {BILLING_SCHEDULE_LABELS, FeeType, PRICE_SHAPE_LABELS} from '../../../../../../../core/models/billing.model';
import {FwPageShellComponent} from '../../../../../../../shared/components/page-shell/page-shell.component';
import {FwButtonComponent} from '../../../../../../../shared/components/button/button.component';
import {BlockLoaderComponent} from '../../../../../../../shared/components/loader/block-loader.component';
import {ConfirmDialogComponent} from '../../../../../../../shared/components/confirm-dialog/confirm-dialog';

interface LevelPriceRow {
  levelName: string;
  price: number | null;
}

const LIST_URL = ['/admin/finance/fee-types'];
const MANAGE_PERMISSION = 'finance:fee:manage';

@Component({
  selector: 'app-fee-type-detail-page',
  standalone: true,
  imports: [CommonModule, MatDialogModule, LucideAngularModule, FwPageShellComponent, FwButtonComponent, BlockLoaderComponent],
  templateUrl: './fee-type-detail-page.component.html',
  styleUrls: ['./fee-type-detail-page.component.scss']
})
export class FeeTypeDetailPageComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private billingService = inject(BillingService);
  private academicService = inject(AcademicService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);

  readonly CreditCard = CreditCard;
  readonly Edit = Edit;
  readonly Power = Power;
  readonly Trash2 = Trash2;
  readonly AlertTriangle = AlertTriangle;
  readonly CheckCircle = CheckCircle;
  readonly XCircle = XCircle;

  readonly PRICE_SHAPE_LABELS = PRICE_SHAPE_LABELS;
  readonly BILLING_SCHEDULE_LABELS = BILLING_SCHEDULE_LABELS;

  private feeTypeId = '';
  feeType = signal<FeeType | null>(null);
  isPageLoading = signal(false);
  isActionLoading = signal(false);
  levelRows = signal<LevelPriceRow[]>([]);

  readonly canManage = computed(() => this.authService.hasPermission(MANAGE_PERMISSION));
  readonly configuredLevelCount = computed(() => this.levelRows().filter(r => r.price != null && r.price > 0).length);

  natureIcon(ft: FeeType): LucideIconData {
    switch (ft.priceShape) {
      case 'PER_LEVEL': return GraduationCap;
      case 'PER_OPTION': return Layers;
      default: return Receipt;
    }
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(LIST_URL);
      return;
    }
    this.feeTypeId = id;
    await this.reload();
  }

  private async reload() {
    this.isPageLoading.set(true);
    try {
      const all = await firstValueFrom(this.billingService.getFeeTypes(true));
      const ft = all.find(f => f.id === this.feeTypeId) ?? null;
      if (!ft) {
        this.notificationService.error('Type de frais introuvable.');
        this.router.navigate(LIST_URL);
        return;
      }
      this.feeType.set(ft);
      if (ft.priceShape === 'PER_LEVEL') {
        await this.loadLevelGrid(ft);
      } else {
        this.levelRows.set([]);
      }
    } catch {
      this.router.navigate(LIST_URL);
    } finally {
      this.isPageLoading.set(false);
    }
  }

  private async loadLevelGrid(ft: FeeType) {
    try {
      const levels = await firstValueFrom(this.academicService.getLevels());
      const priceByLevel = new Map((ft.options ?? []).map(o => [o.code, o.price]));
      this.levelRows.set(levels.map(l => ({levelName: l.name, price: priceByLevel.get(l.id) ?? null})));
    } catch {
      this.levelRows.set([]);
    }
  }

  onEdit() {
    this.router.navigate(['/admin/finance/fee-types', this.feeTypeId, 'edit']);
  }

  async onToggle() {
    const ft = this.feeType();
    if (!ft) return;
    const nextActive = !ft.active;
    this.isActionLoading.set(true);
    try {
      await firstValueFrom(this.billingService.updateFeeType(ft.id, {active: nextActive}));
      this.notificationService.success(nextActive ? `"${ft.label}" a été activé.` : `"${ft.label}" a été désactivé.`);
      await this.reload();
    } catch {
      // Notification déjà affichée par BillingService.handleError
    } finally {
      this.isActionLoading.set(false);
    }
  }

  onDelete() {
    const ft = this.feeType();
    if (!ft) return;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer ce type de frais ?',
        message: `Vous allez supprimer "${ft.label}" du catalogue. Cette action est irréversible.`,
        confirmLabel: 'Oui, supprimer',
        type: 'destructive'
      }
    });

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (!confirmed) return;
      try {
        await firstValueFrom(this.billingService.deleteFeeType(ft.id));
        this.notificationService.success('Type de frais supprimé du catalogue.');
        this.router.navigate(LIST_URL);
      } catch {
        // Notification déjà affichée (ex: FEE_TYPE_IN_USE) par BillingService.handleError
      }
    });
  }
}
