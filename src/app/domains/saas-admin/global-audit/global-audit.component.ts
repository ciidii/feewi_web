import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, History, Search, Filter, Download, ShieldCheck, User, Activity } from 'lucide-angular';
import { DataListComponent } from '../../../shared/components/data-list/data-list.component';
import { TableRow, TabItem } from '../../../shared/models/data-list.models';
import { SchoolService } from '../../../core/services/school.service';
import { AuditLog } from '../../../core/models/audit.model';

@Component({
  selector: 'app-global-audit',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, DataListComponent],
  templateUrl: './global-audit.component.html'
})
export class GlobalAuditComponent implements OnInit {
  private schoolService = inject(SchoolService);

  readonly History = History;
  readonly Search = Search;
  readonly Filter = Filter;
  readonly Download = Download;
  readonly ShieldCheck = ShieldCheck;

  isLoading = signal(false);
  auditLogs = signal<AuditLog[]>([]);
  currentPage = signal(0);
  totalElements = signal(0);
  totalPages = signal(1);

  readonly auditRows = computed<TableRow[]>(() => {
    return this.auditLogs().map(log => ({
      id: log.timestamp + log.actorEmail,
      title: log.action,
      subtitle: `Par: ${log.actorEmail} ${log.targetId ? '• Cible: ' + log.targetId : ''}`,
      avatarLabel: this.getInitials(log.actorEmail),
      date: new Date(log.timestamp).toLocaleString(),
      badges: [{ label: 'SYSTEM', type: 'info' }],
      rawData: log
    }));
  });

  readonly auditTabs: TabItem[] = [
    { label: 'Tous', icon: History },
    { label: 'Sécurité', icon: ShieldCheck },
    { label: 'Provisioning', icon: Activity }
  ];

  ngOnInit() {
    this.loadAuditLogs();
  }

  loadAuditLogs(page: number = 0) {
    this.isLoading.set(true);
    this.schoolService.getGlobalAuditLogs(page).subscribe({
      next: (response) => {
        this.auditLogs.set(response.content);
        this.totalElements.set(response.totalElements);
        this.totalPages.set(response.totalPages);
        this.currentPage.set(response.number);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onPageChange(page: number) {
    this.loadAuditLogs(page);
  }

  private getInitials(email: string): string {
    return email.substring(0, 2).toUpperCase();
  }
}
