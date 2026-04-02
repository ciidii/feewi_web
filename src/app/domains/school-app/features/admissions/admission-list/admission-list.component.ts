import { Component, inject, signal, ViewEncapsulation, OnInit, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule, Filter, Download, Layers, Clock, ShieldCheck, UserCheck, Eye, CheckCircle, XCircle, RefreshCw, Search, UserPlus, ChevronDown } from 'lucide-angular';
import { firstValueFrom, Subject, debounceTime, distinctUntilChanged, takeUntil, finalize } from 'rxjs';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { DataListComponent } from '../../../../../shared/components/data-list/data-list.component';
import { RowAction, TabItem, TableRow } from '../../../../../shared/models/data-list.models';
import { EnrollmentAdminService } from '../../../../../core/services/enrollment-admin.service';
import { AdmissionApplication, AdmissionStatus } from '../../../../../core/models/enrollment.model';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog';
import { NotificationService } from '../../../../../shared/services/notification.service';

@Component({
  selector: 'app-admissions',
  standalone: true,
  imports: [CommonModule, DataListComponent, LucideAngularModule, MatMenuModule, MatDialogModule],
  templateUrl: './admission-list.component.html',
  styleUrl: './admission-list.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class AdmissionsComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private enrollmentAdminService = inject(EnrollmentAdminService);
  private dialog = inject(MatDialog);
  private notificationService = inject(NotificationService);

  readonly Filter = Filter;
  readonly Download = Download;
  readonly Layers = Layers;
  readonly RefreshCw = RefreshCw;
  readonly Search = Search;
  readonly ChevronDown = ChevronDown;
  readonly UserPlus = UserPlus;
  readonly UserCheck = UserCheck;

  // --- ÉTATS ---
  activeTab = signal('Tous');
  rawApplications = signal<AdmissionApplication[]>([]);
  searchQuery = signal('');
  isLoading = signal(false);

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

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

    // Setup search debounce
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.loadAdmissions(query);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.searchQuery.set(query);
    this.searchSubject.next(query);
  }

  async loadAdmissions(query?: string) {
    this.isLoading.set(true);
    try {
      const request = query
        ? this.enrollmentAdminService.searchApplications(query)
        : this.enrollmentAdminService.getApplications();

      const data = await firstValueFrom(request);
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
      subtitle: `Dossier #${app.reference} • ${app.type === 'RE_ENROLLMENT' ? 'Réinscription' : 'Nouvelle Admission'}`,
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
      this.router.navigate(['/admin/admissions', event.row.id]);
    } else if (event.actionId === 'validate') {
      this.handleQuickValidate(event.row.id.toString());
    } else if (event.actionId === 'reject') {
      this.handleQuickReject(event.row.id.toString());
    }
  }

  private handleQuickValidate(id: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmer l\'admission',
        message: 'Êtes-vous sûr de vouloir valider définitivement cette admission ?',
        confirmLabel: 'Confirmer',
        type: 'warning'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.isLoading.set(true);
        this.enrollmentAdminService.validateAdmission(id).pipe(
          finalize(() => this.isLoading.set(false))
        ).subscribe(() => {
          this.notificationService.success('Admission validée.');
          this.loadAdmissions(this.searchQuery());
        });
      }
    });
  }

  private handleQuickReject(id: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Rejeter le dossier',
        message: 'Cette action est irréversible. Souhaitez-vous vraiment rejeter ce dossier ?',
        confirmLabel: 'Rejeter',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.isLoading.set(true);
        this.enrollmentAdminService.rejectAdmission(id, 'Rejet rapide depuis la liste').pipe(
          finalize(() => this.isLoading.set(false))
        ).subscribe(() => {
          this.notificationService.success('Dossier rejeté.');
          this.loadAdmissions(this.searchQuery());
        });
      }
    });
  }

}
