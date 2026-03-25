import { Component, inject, signal, ViewEncapsulation, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule, Filter, Download, Layers, Clock, ShieldCheck, UserCheck, Eye, CheckCircle, XCircle, RefreshCw } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';

import { DataListComponent } from '../../../../../shared/components/data-list/data-list.component';
import { RowAction, TabItem, TableRow } from '../../../../../shared/models/data-list.models';
import { EnrollmentAdminService } from '../../../../../core/services/enrollment-admin.service';
import { AdmissionApplication, AdmissionStatus } from '../../../../../core/models/enrollment.model';

@Component({
  selector: 'app-admissions',
  standalone: true,
  imports: [CommonModule, DataListComponent, LucideAngularModule],
  templateUrl: './admission-list.component.html',
  styleUrl: './admission-list.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class AdmissionsComponent implements OnInit {
  private router = inject(Router);
  private enrollmentAdminService = inject(EnrollmentAdminService);

  readonly Filter = Filter;
  readonly Download = Download;
  readonly Layers = Layers;
  readonly RefreshCw = RefreshCw;

  // --- ÉTATS ---
  activeTab = signal('Tous');
  rawApplications = signal<AdmissionApplication[]>([]);
  isLoading = signal(false);

  // --- LOGIQUE DE FILTRAGE ---
  filteredAdmissions = computed(() => {
    const apps = this.rawApplications();
    const tab = this.activeTab();

    let filtered = apps;
    if (tab === 'À Vérifier') filtered = apps.filter(a => a.status === 'SUBMITTED');
    if (tab === 'À Évaluer') filtered = apps.filter(a => a.status === 'VERIFIED');
    if (tab === 'En Décision') filtered = apps.filter(a => ['TESTING', 'WAITLIST'].includes(a.status));

    return filtered.map(app => this.mapToTableRow(app));
  });

  // --- CONFIGURATION UI ---
  readonly admissionActions: RowAction[] = [
    { id: 'view', label: 'Voir le dossier', icon: Eye, type: 'primary' },
    { id: 'validate', label: 'Approuver', icon: CheckCircle, type: 'success' },
    { id: 'reject', label: 'Rejeter', icon: XCircle, type: 'danger' }
  ];

  admissionTabs = computed<TabItem[]>(() => {
    const apps = this.rawApplications();
    return [
      { label: 'Tous', icon: Layers, count: apps.length },
      { label: 'À Vérifier', icon: Clock, count: apps.filter(a => a.status === 'SUBMITTED').length },
      { label: 'À Évaluer', icon: ShieldCheck, count: apps.filter(a => a.status === 'VERIFIED').length },
      { label: 'En Décision', icon: UserCheck, count: apps.filter(a => ['TESTING', 'WAITLIST'].includes(a.status)).length }
    ];
  });

  async ngOnInit() {
    await this.loadAdmissions();
  }

  async loadAdmissions() {
    this.isLoading.set(true);
    try {
      const data = await firstValueFrom(this.enrollmentAdminService.getApplications());
      this.rawApplications.set(data || []);
    } catch (e) {
      console.error('Erreur lors du chargement des admissions:', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  private mapToTableRow(app: AdmissionApplication): TableRow {
    const candidateName = `${app.candidate?.firstName || ''} ${app.candidate?.lastName || ''}`.trim() || 'Candidat inconnu';
    const initials = (app.candidate?.firstName?.[0] || '') + (app.candidate?.lastName?.[0] || '');

    return {
      id: app.id,
      title: candidateName,
      subtitle: `Dossier #${app.reference} • ${app.type === 'RE_ENROLL' ? 'Réinscription' : 'Nouvelle Admission'}`,
      avatarLabel: initials || '??',
      date: new Date(app.createdAt).toLocaleDateString(),
      badges: [
        { label: this.getStatusLabel(app.status), type: this.getStatusType(app.status) },
        { label: `${app.documents.filter(d => d.status === 'UPLOADED').length}/${app.documents.length} docs`, type: 'info' }
      ]
    };
  }

  private getStatusLabel(status: AdmissionStatus): string {
    const labels: Record<AdmissionStatus, string> = {
      'DRAFT': 'Brouillon',
      'SUBMITTED': 'Soumis',
      'VERIFIED': 'Vérifié',
      'TESTING': 'Évaluation',
      'WAITLIST': 'Attente',
      'VALIDATED': 'Admis',
      'REJECTED': 'Refusé',
      'CANCELLED': 'Annulé'
    };
    return labels[status] || status;
  }

  private getStatusType(status: AdmissionStatus): 'success' | 'warning' | 'danger' | 'info' | 'primary' {
    switch (status) {
      case 'VALIDATED': return 'success';
      case 'SUBMITTED': return 'primary';
      case 'VERIFIED': return 'info';
      case 'TESTING': case 'WAITLIST': return 'warning';
      case 'REJECTED': case 'CANCELLED': return 'danger';
      default: return 'primary';
    }
  }

  onTabChange(tab: string) {
    this.activeTab.set(tab);
  }

  handleAction(event: { actionId: string, row: TableRow }) {
    if (event.actionId === 'view') {
      this.router.navigate(['/admissions', event.row.id]);
    } else {
      console.log(`Action ${event.actionId} sur le dossier ${event.row.id}`);
      // Les actions comme valider/rejeter seront implémentées dans le détail ou ici plus tard
    }
  }
}
