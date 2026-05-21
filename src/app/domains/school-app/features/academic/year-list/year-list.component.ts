import {Component, computed, inject, LOCALE_ID, OnInit, signal} from '@angular/core';
import {CommonModule, formatDate} from '@angular/common';
import {
  Archive,
  Calendar,
  CalendarSearch,
  CheckCircle,
  Clock,
  LucideAngularModule,
  Play,
  Plus,
  RefreshCw
} from 'lucide-angular';
import {DataListComponent} from '../../../../../shared/components/data-list/data-list.component';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {AcademicService} from '../../../../../core/services/academic.service';
import {NotificationService} from '../../../../../shared/services/notification.service';
import {AcademicYear, YearStatus} from '../../../../../core/models/academic.model';
import {RowAction, TabItem, TableRow} from '../../../../../shared/models/data-list.models';
import {YearFormComponent} from './components/year-form/year-form.component';
import {ConfirmDialogComponent} from '../../../../../shared/components/confirm-dialog/confirm-dialog';
import {Router} from '@angular/router';
import {firstValueFrom} from 'rxjs';
import {FwPageShellComponent} from '../../../../../shared/components/page-shell/page-shell.component';
import {FwButtonComponent} from '../../../../../shared/components/button/button.component';
import {FwListCommandBarComponent} from '../../../../../shared/components/list-command-bar/list-command-bar.component';
import {AuthService} from '../../../../../core/services/auth.service';
import {HasPermissionDirective} from '../../../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-year-list',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    DataListComponent,
    MatDialogModule,
    FwPageShellComponent,
    FwButtonComponent,
    FwListCommandBarComponent,
    HasPermissionDirective
  ],
  templateUrl: './year-list.component.html',
  styleUrls: ['./year-list.component.scss']
})
export class YearListComponent implements OnInit {
  private academicService = inject(AcademicService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private locale = inject(LOCALE_ID);

  // Icônes
  readonly Calendar = Calendar;
  readonly Plus = Plus;
  readonly RefreshCw = RefreshCw;

  // États
  years = signal<AcademicYear[]>([]);
  isLoading = signal(true);
  activeTab = signal('Tous');
  searchQuery = signal('');

  readonly canEditYears = computed(() => this.authService.hasPermission('academic:year:write'));

  // Actions dynamiques basées sur le statut de l'année
  readonly yearActions: RowAction[] = [
    {
      id: 'view',
      label: 'Calendrier détaillé',
      icon: CalendarSearch,
      type: 'primary',
      permission: 'academic:year:read'
    },
    {
      id: 'activate',
      label: 'Activer l\'année',
      icon: Play,
      type: 'success',
      permission: 'academic:year:lifecycle',
      hideIf: (row) => row.metadata?.['status'] !== 'PLANNING'
    },
    {
      id: 'archive',
      label: 'Archiver',
      icon: Archive,
      type: 'warning',
      permission: 'academic:year:lifecycle',
      hideIf: (row) => row.metadata?.['status'] !== 'ACTIVE'
    }
  ];

  tabs: TabItem[] = [
    { label: 'Tous', icon: Calendar, count: 0 },
    { label: 'Active', icon: CheckCircle, count: 0 },
    { label: 'En préparation', icon: Clock, count: 0 }
  ];

  activeFilterChips = computed(() => {
    const chips: any[] = [];
    if (this.searchQuery()) {
      chips.push({ key: 'q', label: 'Recherche', value: this.searchQuery() });
    }
    return chips;
  });

  // Transformation des données pour le DataList
  displayYears = computed<TableRow[]>(() => {
    return this.years()
      .filter(y => {
        if (this.activeTab() === 'Active') return y.status === 'ACTIVE';
        if (this.activeTab() === 'En préparation') return y.status === 'PLANNING';
        return true;
      })
      .filter(y => {
        if (!this.searchQuery()) return true;
        return y.label.toLowerCase().includes(this.searchQuery().toLowerCase());
      })
      .map(year => {
        const yearInitials = year.label.split('-').map(p => p.substring(2, 4)).join('/'); // "2025-2026" -> "25/26"

        return {
          id: year.id,
          title: year.label,
          subtitle: `${this.getSystemTypeLabel(year.systemType)} • Exercice du ${formatDate(year.startDate, 'dd/MM/yyyy', this.locale)} au ${formatDate(year.endDate, 'dd/MM/yyyy', this.locale)}`,
          avatarLabel: yearInitials,
          date: `Statut: ${year.status}`,
          badges: [{
            label: year.status,
            type: this.getBadgeType(year.status)
          }],
          metadata: { status: year.status },
          rawData: year
        };
      });
  });

  richDescription = computed(() => {
    const active = this.years().find(y => y.status === 'ACTIVE');
    return `${this.years().length} Sessions enregistrées • Année active : ${active?.label || 'Aucune'}`;
  });

  ngOnInit() {
    this.loadYears();
  }

  private getSystemTypeLabel(type: string): string {
    switch (type) {
      case 'TRIMESTER': return 'Trimestriel';
      case 'SEMESTER': return 'Semestriel';
      case 'ANNUAL': return 'Annuel';
      default: return type;
    }
  }

  async loadYears() {
    this.isLoading.set(true);
    try {
      const data = await firstValueFrom(this.academicService.getYears());
      this.years.set(data);
      this.updateTabsCount(data);
    } catch (error) {
      this.notificationService.error("Impossible de charger le calendrier scolaire.");
    } finally {
      this.isLoading.set(false);
    }
  }

  private updateTabsCount(data: AcademicYear[]) {
    this.tabs[0].count = data.length;
    this.tabs[1].count = data.filter(y => y.status === 'ACTIVE').length;
    this.tabs[2].count = data.filter(y => y.status === 'PLANNING').length;
  }

  private getBadgeType(status: YearStatus): 'success' | 'warning' | 'info' | 'default' {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'PLANNING': return 'warning';
      case 'ARCHIVED': return 'default';
      case 'CLOSING': return 'info';
      default: return 'default';
    }
  }

  handleAction(event: { actionId: string, row: TableRow }) {
    switch (event.actionId) {
      case 'view':
        this.router.navigate(['/admin/academic/years', event.row.id]);
        break;
      case 'activate':
        this.confirmActivation(event.row);
        break;
    }
  }

  private confirmActivation(row: TableRow) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title: 'Activer l\'année scolaire ?',
        message: `Voulez-vous définir "${row.title}" comme l'année de référence ? Cela archivera automatiquement l'année actuellement active.`,
        confirmLabel: 'Oui, activer l\'année',
        type: 'info'
      }
    });

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (confirmed) {
        try {
          await firstValueFrom(this.academicService.activateYear(row.id as string));
          this.notificationService.success(`L'année ${row.title} est maintenant active.`);
          this.loadYears();
        } catch (error) {
          this.notificationService.error("Erreur lors de l'activation.");
        }
      }
    });
  }

  openAddYearForm() {
    const dialogRef = this.dialog.open(YearFormComponent, {
      width: '640px',
      maxWidth: '95vw',
      panelClass: 'feewi-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadYears();
      }
    });
  }

  onTabChange(tab: string) {
    this.activeTab.set(tab);
  }

  removeFilter(key: string) {
    if (key === 'q') this.searchQuery.set('');
  }

  clearAllFilters() {
    this.searchQuery.set('');
  }
}
