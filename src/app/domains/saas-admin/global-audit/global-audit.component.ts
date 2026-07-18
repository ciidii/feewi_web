import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Download, History, LucideAngularModule} from 'lucide-angular';
import {DataListComponent} from '../../../shared/components/data-list/data-list.component';
import {TableRow} from '../../../shared/models/data-list.models';
import {SchoolService} from '../../../core/services/school.service';
import {AuditLog} from '../../../core/models/audit.model';
import {FwPageShellComponent} from '../../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'app-global-audit',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, DataListComponent, FwPageShellComponent],
  templateUrl: './global-audit.component.html'
})
export class GlobalAuditComponent implements OnInit {
  private schoolService = inject(SchoolService);

  readonly HistoryIcon = History;
  readonly Download = Download;

  isLoading = signal(false);
  isExporting = signal(false);
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

  /** Export CSV côté client des entrées d'audit récentes (jusqu'à 1000). */
  exportCsv() {
    this.isExporting.set(true);
    this.schoolService.getGlobalAuditLogs(0, 1000).subscribe({
      next: (response) => {
        this.downloadCsv(response.content);
        this.isExporting.set(false);
      },
      error: () => this.isExporting.set(false)
    });
  }

  private downloadCsv(logs: AuditLog[]) {
    const header = ['Date', 'Acteur', 'Action', 'Cible', 'Description'];
    const rows = logs.map(l => [
      new Date(l.timestamp).toLocaleString('fr-FR'),
      l.actorEmail ?? '',
      l.action ?? '',
      l.targetId ?? '',
      l.description ?? ''
    ]);
    const csv = [header, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      .join('\r\n');
    // BOM ﻿ pour l'ouverture correcte des accents dans Excel.
    const blob = new Blob(['﻿' + csv], {type: 'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-feewi-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private getInitials(email: string): string {
    return email.substring(0, 2).toUpperCase();
  }
}
