import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {AlertTriangle, CreditCard, Edit, GraduationCap, Layers, LucideAngularModule, Plus, Receipt, RefreshCw, Search, Settings, ToggleLeft, ToggleRight, Trash2} from 'lucide-angular';
import type {LucideIconData} from 'lucide-angular';
import {firstValueFrom} from 'rxjs';
import {BillingService} from '../../../../../core/services/billing.service';
import {NotificationService} from '../../../../../shared/services/notification.service';
import {BILLING_SCHEDULE_LABELS, BillingSettings, FeeType, PriceShape} from '../../../../../core/models/billing.model';
import {DataListComponent} from '../../../../../shared/components/data-list/data-list.component';
import {Badge, RowAction, TableRow} from '../../../../../shared/models/data-list.models';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {FeeTypeFormComponent} from './components/fee-type-form/fee-type-form.component';
import {ConfirmDialogComponent} from '../../../../../shared/components/confirm-dialog/confirm-dialog';

import {FwPageShellComponent} from '../../../../../shared/components/page-shell/page-shell.component';
import {FwEmptyStateComponent} from '../../../../../shared/components/empty-state/empty-state.component';
import {FwAlertBannerComponent} from '../../../../../shared/components/alert-banner/alert-banner.component';
import {FwListCommandBarComponent} from '../../../../../shared/components/list-command-bar/list-command-bar.component';
import {FwButtonComponent} from '../../../../../shared/components/button/button.component';
import {AuthService} from '../../../../../core/services/auth.service';
import {HasPermissionDirective} from '../../../../../shared/directives/has-permission.directive';

const MANAGE_PERMISSION = 'finance:fee:manage';

/** Section du catalogue regroupée par nature (ADR-012 §3), clé = priceShape. */
interface CatalogSection {
  key: PriceShape;
  title: string;
  description: string;
  icon: LucideIconData;
  rows: TableRow[];
}

@Component({
  selector: 'app-fee-type-catalog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    DataListComponent,
    MatDialogModule,
    FwPageShellComponent,
    FwEmptyStateComponent,
    FwAlertBannerComponent,
    FwListCommandBarComponent,
    FwButtonComponent,
    HasPermissionDirective
  ],
  templateUrl: './fee-type-catalog.component.html',
  styleUrls: ['./fee-type-catalog.component.scss']
})
export class FeeTypeCatalogComponent implements OnInit {
  private billingService = inject(BillingService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);

  // Icônes
  readonly CreditCard = CreditCard;
  readonly Plus = Plus;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly ToggleLeft = ToggleLeft;
  readonly ToggleRight = ToggleRight;
  readonly Search = Search;
  readonly RefreshCw = RefreshCw;
  readonly Settings = Settings;
  readonly AlertTriangle = AlertTriangle;

  // États
  feeTypes = signal<FeeType[]>([]);
  isLoading = signal(true);
  searchQuery = signal('');

  // Réglages de facturation (ADR-009 §5)
  billingSettings = signal<BillingSettings | null>(null);
  nombreMensualitesInput = signal<number | null>(null);
  isSavingSettings = signal(false);

  readonly canManage = computed(() => this.authService.hasPermission(MANAGE_PERMISSION));

  activeFilterChips = computed(() => {
    const chips: any[] = [];
    if (this.searchQuery()) {
      chips.push({key: 'q', label: 'Recherche', value: this.searchQuery()});
    }
    return chips;
  });

  // Actions par ligne — activer/désactiver sont mutuellement exclusives selon l'état courant
  readonly feeTypeActions: RowAction[] = [
    {id: 'edit', label: 'Modifier', icon: Edit, type: 'primary', permission: MANAGE_PERMISSION},
    {
      id: 'activate',
      label: 'Activer',
      icon: ToggleRight,
      type: 'success',
      permission: MANAGE_PERMISSION,
      hideIf: (row) => !!row.rawData?.active
    },
    {
      id: 'deactivate',
      label: 'Désactiver',
      icon: ToggleLeft,
      type: 'default',
      permission: MANAGE_PERMISSION,
      hideIf: (row) => !row.rawData?.active
    },
    {
      id: 'delete',
      label: 'Supprimer',
      icon: Trash2,
      type: 'danger',
      permission: MANAGE_PERMISSION,
      hideIf: (row) => !!row.rawData?.isSystemDefined
    }
  ];

  /**
   * Un type structurant PER_LEVEL est "tarif non configuré" tant qu'aucune option de niveau
   * n'a de prix (> 0) — risque de non-facturation silencieuse (ADR-012 §3).
   */
  private isPriceUnconfigured(ft: FeeType): boolean {
    return ft.priceShape === 'PER_LEVEL' && !(ft.options ?? []).some(o => o.price > 0);
  }

  /** Types PER_LEVEL actifs sans aucun tarif de niveau — alimentent l'alerte en tête de page. */
  unconfiguredTypes = computed<FeeType[]>(() =>
    this.feeTypes().filter(ft => ft.active && this.isPriceUnconfigured(ft))
  );

  /** Libellés des types non configurés, pour le corps de l'alerte. */
  unconfiguredTypesLabel = computed<string>(() =>
    this.unconfiguredTypes().map(ft => ft.label).join(', ')
  );

  private toRow(ft: FeeType): TableRow {
    const badges: Badge[] = [
      {label: ft.active ? 'Actif' : 'Inactif', type: ft.active ? 'success' : 'default'},
      ...(ft.isSystemDefined ? [{label: 'Système', type: 'info' as const}] : []),
      {label: BILLING_SCHEDULE_LABELS[ft.billingSchedule], type: 'default' as const},
    ];

    if (this.isPriceUnconfigured(ft)) {
      badges.push({label: 'Tarif non configuré', type: 'warning', tooltip: 'Aucun niveau n\'a de tarif — ce frais ne sera pas facturé.'});
    } else if (ft.priceShape === 'PER_LEVEL') {
      const priced = (ft.options ?? []).filter(o => o.price > 0).length;
      badges.push({label: `${priced} niveau${priced > 1 ? 'x' : ''} tarifé${priced > 1 ? 's' : ''}`, type: 'primary'});
    } else if (ft.priceShape === 'PER_OPTION') {
      const n = ft.options?.length ?? 0;
      badges.push({label: `${n} option${n > 1 ? 's' : ''}`, type: 'primary'});
    } else if (ft.defaultAmount != null) {
      badges.push({label: `${ft.defaultAmount.toLocaleString('fr-FR')} FCFA`, type: 'primary'});
    }

    return {
      id: ft.id,
      title: ft.label,
      subtitle: `Code : ${ft.code}`,
      avatarLabel: ft.code.substring(0, 2).toUpperCase(),
      badges,
      rawData: ft
    };
  }

  /** Définition ordonnée des sections de nature (ADR-012 §3). */
  private readonly sectionDefs: {key: PriceShape; title: string; description: string; icon: LucideIconData}[] = [
    {key: 'PER_LEVEL', title: 'Frais académiques', description: 'Scolarité, inscription et réinscription — tarifés par niveau.', icon: GraduationCap},
    {key: 'PER_OPTION', title: 'Services optionnels', description: 'Cantine, transport… — tarifés par formule ou zone.', icon: Layers},
    {key: 'FLAT', title: 'Frais ponctuels', description: 'Forfaits et frais uniques — montant simple.', icon: Receipt},
  ];

  // Catalogue regroupé par nature, filtré par la recherche — une section vide n'est pas rendue.
  displaySections = computed<CatalogSection[]>(() => {
    const query = this.searchQuery().toLowerCase();
    const matches = this.feeTypes()
      .filter(ft => ft.label.toLowerCase().includes(query) || ft.code.toLowerCase().includes(query));

    return this.sectionDefs
      .map(def => ({
        ...def,
        rows: matches.filter(ft => ft.priceShape === def.key).map(ft => this.toRow(ft))
      }))
      .filter(section => section.rows.length > 0);
  });

  // Total filtré (tous nature confondues) — pilote l'état vide global.
  totalDisplayed = computed<number>(() => this.displaySections().reduce((sum, s) => sum + s.rows.length, 0));

  ngOnInit() {
    this.loadData();
    this.loadBillingSettings();
  }

  async loadData() {
    this.isLoading.set(true);
    try {
      const data = await firstValueFrom(this.billingService.getFeeTypes(true));
      this.feeTypes.set(data);
    } catch (error) {
      // La notification d'erreur est déjà déclenchée par BillingService.handleError
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadBillingSettings() {
    try {
      const settings = await firstValueFrom(this.billingService.getBillingSettings());
      this.billingSettings.set(settings);
      this.nombreMensualitesInput.set(settings.nombreMensualites);
    } catch (error) {
      // La notification d'erreur est déjà déclenchée par BillingService.handleError
    }
  }

  async saveBillingSettings() {
    const value = this.nombreMensualitesInput();
    if (value == null || value < 1) return;

    this.isSavingSettings.set(true);
    try {
      const updated = await firstValueFrom(this.billingService.updateBillingSettings({nombreMensualites: value}));
      this.billingSettings.set(updated);
      this.notificationService.success('Réglage de mensualisation mis à jour.');
    } catch (error) {
      // La notification d'erreur est déjà déclenchée par BillingService.handleError
    } finally {
      this.isSavingSettings.set(false);
    }
  }

  handleAction(event: { actionId: string, row: TableRow }) {
    const feeType: FeeType = event.row.rawData;
    switch (event.actionId) {
      case 'edit':
        this.openFeeTypeForm(feeType);
        break;
      case 'activate':
        this.toggleActive(feeType, true);
        break;
      case 'deactivate':
        this.toggleActive(feeType, false);
        break;
      case 'delete':
        this.confirmDelete(feeType);
        break;
    }
  }

  openFeeTypeForm(feeType?: FeeType) {
    const dialogRef = this.dialog.open(FeeTypeFormComponent, {
      width: '640px',
      panelClass: 'feewi-dialog-panel',
      data: {feeType}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadData();
    });
  }

  private async toggleActive(feeType: FeeType, nextActive: boolean) {
    try {
      await firstValueFrom(this.billingService.updateFeeType(feeType.id, {active: nextActive}));
      this.notificationService.success(
        nextActive ? `"${feeType.label}" a été activé.` : `"${feeType.label}" a été désactivé.`
      );
      this.loadData();
    } catch (error) {
      // La notification d'erreur est déjà déclenchée par BillingService.handleError
    }
  }

  private async confirmDelete(feeType: FeeType) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer ce type de frais ?',
        message: `Vous allez supprimer "${feeType.label}" du catalogue. Cette action est irréversible.`,
        confirmLabel: 'Oui, supprimer',
        type: 'destructive'
      }
    });

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (confirmed) {
        try {
          await firstValueFrom(this.billingService.deleteFeeType(feeType.id));
          this.notificationService.success('Type de frais supprimé du catalogue.');
          this.loadData();
        } catch (error) {
          // La notification d'erreur (ex: FEE_TYPE_IN_USE, FEE_TYPE_SYSTEM_DEFINED)
          // est déjà déclenchée par BillingService.handleError
        }
      }
    });
  }

  removeFilter(key: string) {
    if (key === 'q') this.searchQuery.set('');
  }

  clearAllFilters() {
    this.searchQuery.set('');
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
  }
}
