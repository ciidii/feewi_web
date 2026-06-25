import {Component, computed, inject, OnInit, signal, ViewEncapsulation} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  Activity,
  CreditCard,
  Download,
  GraduationCap,
  History,
  LucideAngularModule,
  RefreshCw,
  Search,
  ShieldAlert
} from 'lucide-angular';
import {firstValueFrom} from 'rxjs';
import {DataListComponent} from '../../../../../shared/components/data-list/data-list.component';
import {TabItem, TableRow} from '../../../../../shared/models/data-list.models';
import {IdentityService} from '../../../../../core/services/identity.service';
import {AuditLog} from '../../../../../core/models/audit.model';
import {FwPageShellComponent} from '../../../../../shared/components/page-shell/page-shell.component';
import {FwButtonComponent} from '../../../../../shared/components/button/button.component';
import {FwListCommandBarComponent} from '../../../../../shared/components/list-command-bar/list-command-bar.component';
import {HasPermissionDirective} from '../../../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-audit-trail',
  standalone: true,
  imports: [
    CommonModule,
    DataListComponent,
    LucideAngularModule,
    FwPageShellComponent,
    FwButtonComponent,
    FwListCommandBarComponent
  ],
  templateUrl: './audit-trail.component.html',
  styleUrl: './audit-trail.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class AuditTrailComponent implements OnInit {
  private identityService = inject(IdentityService);

  readonly HistoryIcon = History;
  readonly RefreshCw = RefreshCw;
  readonly Download = Download;

  activeTab = signal('Tous');
  totalLogs = signal(0);
  isLoading = signal(false);
  searchQuery = signal('');

  auditLogs = signal<TableRow[]>([]);

  activeFilterChips = computed(() => {
    const chips: any[] = [];
    if (this.searchQuery()) {
      chips.push({ key: 'q', label: 'Recherche', value: this.searchQuery() });
    }
    return chips;
  });

  auditTabs: TabItem[] = [
    { label: 'Tous', icon: Activity, count: 0 },
    { label: 'Sécurité', icon: ShieldAlert, count: 0 },
    { label: 'Scolarité', icon: GraduationCap, count: 0 },
    { label: 'Finance', icon: CreditCard, count: 0 }
  ];

  ngOnInit() {
    this.loadLogs();
  }

  async loadLogs(page: number = 0) {
    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(this.identityService.getTenantAuditLogs(page));
      this.totalLogs.set(response.totalElements);
      this.auditLogs.set(response.content.map((log, index) => this.mapLogToRow(log, index)));

      // Update tabs count (simplified for now)
      this.auditTabs[0].count = response.totalElements;
    } catch (error) {
      console.error('Failed to load audit logs', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private mapLogToRow(log: AuditLog, index: number): TableRow {
    return {
      id: index,
      title: this.formatAction(log.action),
      subtitle: `${log.description} par ${log.actorEmail}`,
      avatarLabel: log.actorEmail.substring(0, 2).toUpperCase(),
      date: new Date(log.timestamp).toLocaleString(),
      badges: [
        { label: this.getCategoryForAction(log.action), type: this.getBadgeTypeForAction(log.action) },
        { label: 'TERMINÉ', type: 'success' }
      ]
    };
  }

  private formatAction(action: string): string {
    return action.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }

  private getCategoryForAction(action: string): string {
    if (action.includes('LOGIN') || action.includes('PERMISSION') || action.includes('ROLE')) return 'SÉCURITÉ';
    if (action.includes('SCHOOL')) return 'SYSTÈME';
    return 'GÉNÉRAL';
  }

  private getBadgeTypeForAction(action: string): 'info' | 'success' | 'warning' | 'danger' | 'default' {
    if (action.includes('FAILURE')) return 'danger';
    if (action.includes('SUCCESS')) return 'success';
    if (action.includes('CREATED')) return 'info';
    return 'default';
  }

  onTabChange(tab: string) {
    this.activeTab.set(tab);
    // On pourrait filtrer ici si l'API le permettait via paramètre
  }

  handleAction(event: { actionId: string, row: TableRow }) {
    // Aucune action sur les logs d'audit pour le moment
  }
}
