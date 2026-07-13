import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CreditCard, Edit, LucideAngularModule, Plus, RefreshCw, Search, ToggleLeft, ToggleRight, Trash2} from 'lucide-angular';
import {firstValueFrom} from 'rxjs';
import {BillingService} from '../../../../../core/services/billing.service';
import {NotificationService} from '../../../../../shared/services/notification.service';
import {FeeType} from '../../../../../core/models/billing.model';
import {DataListComponent} from '../../../../../shared/components/data-list/data-list.component';
import {RowAction, TableRow} from '../../../../../shared/models/data-list.models';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {FeeTypeFormComponent} from './components/fee-type-form/fee-type-form.component';
import {ConfirmDialogComponent} from '../../../../../shared/components/confirm-dialog/confirm-dialog';

import {FwPageShellComponent} from '../../../../../shared/components/page-shell/page-shell.component';
import {FwEmptyStateComponent} from '../../../../../shared/components/empty-state/empty-state.component';
import {FwListCommandBarComponent} from '../../../../../shared/components/list-command-bar/list-command-bar.component';
import {FwButtonComponent} from '../../../../../shared/components/button/button.component';
import {AuthService} from '../../../../../core/services/auth.service';
import {HasPermissionDirective} from '../../../../../shared/directives/has-permission.directive';

const MANAGE_PERMISSION = 'finance:fee:manage';

@Component({
  selector: 'app-fee-type-catalog',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    DataListComponent,
    MatDialogModule,
    FwPageShellComponent,
    FwEmptyStateComponent,
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

  // États
  feeTypes = signal<FeeType[]>([]);
  isLoading = signal(true);
  searchQuery = signal('');

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

  // Transformation du catalogue pour le DataList avec filtrage
  displayFeeTypes = computed<TableRow[]>(() => {
    const query = this.searchQuery().toLowerCase();
    return this.feeTypes()
      .filter(ft => ft.label.toLowerCase().includes(query) || ft.code.toLowerCase().includes(query))
      .map(ft => ({
        id: ft.id,
        title: ft.label,
        subtitle: `Code : ${ft.code}`,
        avatarLabel: ft.code.substring(0, 2).toUpperCase(),
        badges: [
          {label: ft.active ? 'Actif' : 'Inactif', type: ft.active ? 'success' : 'default'},
          ...(ft.isSystemDefined ? [{label: 'Système', type: 'info' as const}] : []),
          ...(ft.defaultAmount != null ? [{label: 'Facturation auto', type: 'primary' as const}] : [])
        ],
        rawData: ft
      }));
  });

  ngOnInit() {
    this.loadData();
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
      width: '480px',
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
