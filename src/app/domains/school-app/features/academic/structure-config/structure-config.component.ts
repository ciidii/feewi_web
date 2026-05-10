import {Component, computed, inject, OnInit, signal, ViewEncapsulation} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import {firstValueFrom} from 'rxjs';
import {
  ArrowRight,
  Edit,
  Filter,
  Info,
  Layers,
  LucideAngularModule,
  Plus,
  RefreshCw,
  Trash2
} from 'lucide-angular';
import {AcademicService} from '../../../../../core/services/academic.service';
import {AuthService} from '../../../../../core/services/auth.service';
import {NotificationService} from '../../../../../shared/services/notification.service';
import {LoadingService} from '../../../../../shared/services/loading.service';
import {Cycle} from '../../../../../core/models/academic.model';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {DataListComponent} from '../../../../../shared/components/data-list/data-list.component';
import {RowAction, TableRow} from '../../../../../shared/models/data-list.models';
import {CycleFormComponent} from './components/cycle-form/cycle-form.component';
import {ConfirmDialogComponent} from '../../../../../shared/components/confirm-dialog/confirm-dialog';
import {FwButtonComponent} from '../../../../../shared/components/button/button.component';
import {FwAlertBannerComponent} from '../../../../../shared/components/alert-banner/alert-banner.component';
import {FwPageShellComponent} from '../../../../../shared/components/page-shell/page-shell.component';
import {FwListCommandBarComponent} from '../../../../../shared/components/list-command-bar/list-command-bar.component';
import {FormsModule} from '@angular/forms';
import {FwEmptyStateComponent} from '../../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-structure-config',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    MatDialogModule,
    DataListComponent,
    FwButtonComponent,
    FwAlertBannerComponent,
    FwPageShellComponent,
    FwListCommandBarComponent,
    FormsModule,
    FwEmptyStateComponent
  ],
  templateUrl: './structure-config.component.html',
  styleUrls: ['./structure-config.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class StructureConfigComponent implements OnInit {
  private academicService = inject(AcademicService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  protected loadingService = inject(LoadingService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  // Icônes
  readonly Plus = Plus;
  readonly Layers = Layers;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly ArrowRight = ArrowRight;
  readonly InfoIcon = Info;
  readonly RefreshCw = RefreshCw;
  readonly Filter = Filter;

  // États
  cycles = signal<Cycle[]>([]);
  searchQuery = signal('');

  // Autorisations (Provisioning)
  readonly canEditStructure = computed(() => this.authService.hasRole('ROLE_SUPER_ADMIN'));

  // Actions pour les cycles
  readonly cycleActions = computed<RowAction[]>(() => {
    const actions: RowAction[] = [
      {id: 'open', label: 'Gérer le cycle', icon: ArrowRight, type: 'primary'}
    ];
    if (this.canEditStructure()) {
      actions.push({id: 'edit', label: 'Personnaliser', icon: Edit, type: 'primary'});
      actions.push({id: 'delete', label: 'Supprimer', icon: Trash2, type: 'danger'});
    }
    return actions;
  });

  // Transformation des cycles pour le DataList
  displayCycles = computed<TableRow[]>(() => {
    const query = this.searchQuery().toLowerCase();
    return this.cycles()
      .filter(c => {
        if (!query) return true;
        const name = (c.customName || c.systemName || '').toLowerCase();
        const code = (c.cycleCode || '').toLowerCase();
        return name.includes(query) || code.includes(query);
      })
      .map(c => ({
        id: c.id,
        title: c.customName || c.systemName || c.cycleCode || c.id,
        subtitle: `Code Système : ${c.cycleCode ?? '—'}`,
        avatarLabel: (c.cycleCode ?? c.id).substring(0, 2).toUpperCase(),
        badges: [
          {label: 'ACTIF', type: 'success'},
          {label: `RANG ${c.rank}`, type: 'info'}
        ],
        metadata: {
          domain: 'Éducation',
          location: 'National'
        },
        rawData: c
      }));
  });

  activeFilterChips = computed(() => {
    const chips: any[] = [];
    if (this.searchQuery()) {
      chips.push({ key: 'q', label: 'Recherche', value: this.searchQuery() });
    }
    return chips;
  });

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    // Utilisation de notre utilitaire de chargement de fondation
    await this.loadingService.execute(async () => {
      try {
        const cyclesData = await firstValueFrom(this.academicService.getCycles());
        this.cycles.set(cyclesData.sort((a, b) => a.rank - b.rank));
      } catch (error) {
        this.notificationService.error("Erreur lors du chargement de la structure.");
      }
    }, 'component');
  }

  handleCycleAction(event: { actionId: string, row: TableRow }) {
    const cycle = event.row.rawData as Cycle;
    if (event.actionId === 'open') {
      this.goToCycle(cycle.id);
    } else if (event.actionId === 'edit') {
      this.onEditCycle(cycle);
    } else if (event.actionId === 'delete') {
      this.onDeleteCycle(cycle);
    }
  }

  // Navigation vers le Cockpit du Cycle (Drill-down)
  goToCycle(id: string | number) {
    this.router.navigate(['/admin/classes/cycles', id.toString()]);
  }

  // --- ACTIONS CYCLES (Super Admin uniquement) ---

  openAddCycle() {
    const dialogRef = this.dialog.open(CycleFormComponent, {
      width: '480px',
      panelClass: 'feewi-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadData();
    });
  }

  onEditCycle(cycle: Cycle) {
    const dialogRef = this.dialog.open(CycleFormComponent, {
      width: '480px',
      panelClass: 'feewi-dialog-panel',
      data: {cycle}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadData();
    });
  }

  onDeleteCycle(cycle: Cycle) {
    const cycleName = cycle.customName || cycle.systemName;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer le cycle ?',
        message: `Voulez-vous supprimer le cycle "${cycleName}" ? Tous les niveaux rattachés à ce cycle seront impactés.`,
        confirmLabel: 'Oui, supprimer le cycle',
        type: 'destructive'
      }
    });

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (confirmed) {
        await this.loadingService.execute(async () => {
          try {
            await firstValueFrom(this.academicService.deleteCycle(cycle.id));
            this.notificationService.success('Cycle supprimé avec succès.');
            this.loadData();
          } catch (error) {
            this.notificationService.error('Erreur lors de la suppression.');
          }
        }, 'global');
      }
    });
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
  }

  removeFilter(key: string) {
    if (key === 'q') this.searchQuery.set('');
  }

  clearAllFilters() {
    this.searchQuery.set('');
  }
}
