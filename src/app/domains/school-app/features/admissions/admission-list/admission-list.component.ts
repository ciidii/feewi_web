import {Component, computed, inject, OnDestroy, OnInit, signal, ViewEncapsulation} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import {
  ArrowRight,
  CheckCircle,
  ChevronDown,
  Clock,
  Download,
  Eye,
  Filter,
  Layers,
  LucideAngularModule,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  UserPlus,
  X,
  XCircle
} from 'lucide-angular';
import {debounceTime, distinctUntilChanged, finalize, firstValueFrom, Subject, takeUntil} from 'rxjs';
import {MatMenuModule} from '@angular/material/menu';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';

import {DataListComponent} from '../../../../../shared/components/data-list/data-list.component';
import {RowAction, TabItem, TableRow} from '../../../../../shared/models/data-list.models';
import {EnrollmentAdminService} from '../../../../../core/services/enrollment-admin.service';
import {AcademicService} from '../../../../../core/services/academic.service';
import {Admission, AdmissionStatus} from '../../../../../core/models/enrollment.model';
import {AcademicYear, Level} from '../../../../../core/models/academic.model';
import {ConfirmDialogComponent} from '../../../../../shared/components/confirm-dialog/confirm-dialog';
import {NotificationService} from '../../../../../shared/services/notification.service';
import {FormsModule} from '@angular/forms';

import {FwPageShellComponent} from '../../../../../shared/components/page-shell/page-shell.component';
import {FwButtonComponent} from '../../../../../shared/components/button/button.component';
import {FwListCommandBarComponent} from '../../../../../shared/components/list-command-bar/list-command-bar.component';

import {AdmissionFilterModalComponent} from './components/admission-filter-modal/admission-filter-modal.component';

@Component({
  selector: 'app-admissions',
  standalone: true,
  imports: [
    CommonModule,
    DataListComponent,
    LucideAngularModule,
    MatMenuModule,
    MatDialogModule,
    FormsModule,
    FwPageShellComponent,
    FwButtonComponent,
    FwListCommandBarComponent
  ],
  templateUrl: './admission-list.component.html',
  styleUrl: './admission-list.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class AdmissionsComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private enrollmentAdminService = inject(EnrollmentAdminService);
  private academicService = inject(AcademicService);
  private dialog = inject(MatDialog);
  private notificationService = inject(NotificationService);

  // --- ÉTATS ---
  activeTab = signal('Tous');
  searchQuery = signal('');
  isLoading = signal(false);

  // Filtres Avancés (Signals)
  selectedLevel = signal<string>('');
  selectedYear = signal<string>('');
  selectedChannel = signal<string>('');
  incompleteOnly = signal<boolean>(false);
  selectedStartDate = signal<string>('');
  selectedEndDate = signal<string>('');

  // ... (rest of class)

  openFilterModal() {
    const dialogRef = this.dialog.open(AdmissionFilterModalComponent, {
      width: '400px',
      data: {
        selectedYear: this.selectedYear(),
        selectedLevel: this.selectedLevel(),
        selectedChannel: this.selectedChannel(),
        selectedStartDate: this.selectedStartDate(),
        selectedEndDate: this.selectedEndDate(),
        levels: this.levels(),
        years: this.years()
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.selectedYear.set(result.year);
        this.selectedLevel.set(result.level);
        this.selectedChannel.set(result.channel);
        this.selectedStartDate.set(result.start);
        this.selectedEndDate.set(result.end);
        this.onFilterChange();
      }
    });
  }

  // Données de référence pour les filtres
  levels = signal<Level[]>([]);
  years = signal<AcademicYear[]>([]);

  // Pagination
  currentPage = signal(0);
  pageSize = signal(20);
  pageSizeOptions = [20, 50, 100, 200];
  totalElements = signal(0);
  totalPages = signal(1);

  onPageSizeChange(newSize: number) {
    this.pageSize.set(newSize);
    this.currentPage.set(0);
    this.loadAdmissions();
  }

  rawApplications = signal<Admission[]>([]);

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // --- LOGIQUE DE FILTRAGE (Relayée au Backend) ---
  admissionRows = computed(() => {
    return this.rawApplications().map(app => this.mapToTableRow(app));
  });

  // --- FILTER CHIPS LOGIC ---
  activeFilterChips = computed(() => {
    const chips: { key: string, label: string, value: string }[] = [];

    if (this.searchQuery()) {
      chips.push({key: 'q', label: 'Recherche', value: this.searchQuery()});
    }

    if (this.selectedYear()) {
      const year = this.years().find(y => y.id === this.selectedYear());
      if (year) chips.push({key: 'year', label: 'Année', value: year.label});
    }

    if (this.selectedLevel()) {
      const level = this.levels().find(l => l.id === this.selectedLevel());
      if (level) chips.push({key: 'level', label: 'Niveau', value: level.name});
    }

    if (this.selectedChannel()) {
      const label = this.selectedChannel() === 'DIGITAL' ? 'Portail Public' : 'Saisie Guichet';
      chips.push({key: 'channel', label: 'Canal', value: label});
    }

    if (this.incompleteOnly()) {
      chips.push({key: 'incomplete', label: 'État', value: 'Dossiers Incomplets'});
    }

    if (this.selectedStartDate() || this.selectedEndDate()) {
      const start = this.selectedStartDate() || '...';
      const end = this.selectedEndDate() || '...';
      chips.push({key: 'dates', label: 'Période', value: `${start} au ${end}`});
    }

    return chips;
  });

  removeFilter(key: string) {
    if (key === 'q') this.searchQuery.set('');
    if (key === 'year') this.selectedYear.set('');
    if (key === 'level') this.selectedLevel.set('');
    if (key === 'channel') this.selectedChannel.set('');
    if (key === 'incomplete') this.incompleteOnly.set(false);
    if (key === 'dates') {
      this.selectedStartDate.set('');
      this.selectedEndDate.set('');
    }
    this.onFilterChange();
  }

  clearAllFilters() {
    this.searchQuery.set('');
    this.selectedYear.set('');
    this.selectedLevel.set('');
    this.selectedChannel.set('');
    this.incompleteOnly.set(false);
    this.selectedStartDate.set('');
    this.selectedEndDate.set('');
    this.onFilterChange();
  }

  // --- CONFIGURATION UI ---
  readonly admissionActions: RowAction[] = [
    {id: 'view', label: 'Voir le dossier', icon: Eye, type: 'primary'},
    {id: 'validate', label: 'Approuver', icon: CheckCircle, type: 'success'},
    {id: 'reject', label: 'Rejeter', icon: XCircle, type: 'danger'}
  ];

  admissionTabs = computed<TabItem[]>(() => {
    return [
      {label: 'Tous', icon: Layers, count: this.totalElements()},
      {label: 'À Vérifier', icon: Clock},
      {label: 'À Évaluer', icon: ShieldCheck},
      {label: 'En Décision', icon: UserCheck}
    ];
  });

  async ngOnInit() {
    this.loadFilterData();
    await this.loadAdmissions();

    // Setup search debounce
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.currentPage.set(0);
      this.loadAdmissions();
    });
  }

  loadFilterData() {
    this.academicService.getLevels().subscribe(levels => this.levels.set(levels));
    this.academicService.getYears().subscribe(years => this.years.set(years));
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

  onFilterChange() {
    this.currentPage.set(0);
    this.loadAdmissions();
  }

  async loadAdmissions() {
    this.isLoading.set(true);

    let status: AdmissionStatus | undefined;
    const tab = this.activeTab();
    if (tab === 'À Vérifier') status = 'SUBMITTED';
    if (tab === 'À Évaluer') status = 'VERIFIED';
    if (tab === 'En Décision') status = 'TESTING';

    try {
      const response = await firstValueFrom(
        this.enrollmentAdminService.getApplications({
          q: this.searchQuery(),
          status: status,
          levelId: this.selectedLevel() || undefined,
          academicYearId: this.selectedYear() || undefined,
          channel: (this.selectedChannel() as any) || undefined,
          page: this.currentPage(),
          size: this.pageSize(),
          // Note: Les filtres 'incompleteOnly' et 'dates' sont prêts pour l'API
        } as any)
      );

      this.rawApplications.set(response.content || []);
      this.totalElements.set(response.totalElements);
      this.totalPages.set(response.totalPages);
    } catch (e) {
      console.error('Erreur lors du chargement des admissions:', e);
      this.notificationService.error('Erreur lors du chargement des données');
    } finally {
      this.isLoading.set(false);
    }
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadAdmissions();
  }

  private mapToTableRow(app: Admission): TableRow {
    const candidateName = `${app.identity?.firstName || ''} ${app.identity?.lastName || ''}`.trim() || 'Candidat inconnu';
    const initials = (app.identity?.firstName?.[0] || '') + (app.identity?.lastName?.[0] || '');

    return {
      id: app.id,
      title: candidateName,
      subtitle: `Dossier #${app.reference}`,
      avatarLabel: initials || '??',
      date: new Date(app.createdAt).toLocaleDateString(),
      metadata: {
        'Type': app.type === 'RE_ENROLLMENT' ? 'Réinscription' : 'Nouvelle Admission',
        'Niveau': app.schooling?.levelLabel || '—',
        'Canal': app.channel === 'DIGITAL' ? '💻 Portail' : '🏢 Guichet',
        'École d\'origine': app.schooling?.customFields?.['previousSchool'] || '—'
      },
      badges: [
        {label: this.getStatusLabel(app.status), type: this.getStatusType(app.status)},
        {
          label: `${app.documents.filter(d => ['UPLOADED', 'RECEIVED', 'VERIFIED'].includes(d.status)).length}/${app.documents.length} docs`,
          type: 'info'
        }
      ]
    };
  }

  private getStatusLabel(status: AdmissionStatus): string {
    const labels: Record<AdmissionStatus, string> = {
      'DRAFT': 'Brouillon',
      'SUBMITTED': 'Soumis',
      'VERIFIED': 'Vérifié',
      'TESTING': 'Évaluation',
      'ADMITTED': 'Admis pédago.',
      'WAITLIST': 'Attente',
      'VALIDATED': 'Admis',
      'REJECTED': 'Refusé',
      'CANCELLED': 'Annulé'
    };
    return labels[status] || status;
  }

  private getStatusType(status: AdmissionStatus): 'success' | 'warning' | 'danger' | 'info' | 'primary' {
    switch (status) {
      case 'VALIDATED':
        return 'success';
      case 'SUBMITTED':
        return 'primary';
      case 'VERIFIED':
        return 'info';
      case 'TESTING':
      case 'WAITLIST':
        return 'warning';
      case 'REJECTED':
      case 'CANCELLED':
        return 'danger';
      default:
        return 'primary';
    }
  }

  onTabChange(tab: string) {
    this.activeTab.set(tab);
    this.onFilterChange();
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
          this.loadAdmissions();
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
          this.loadAdmissions();
        });
      }
    });
  }

  protected readonly CheckCircle = CheckCircle;
  readonly Filter = Filter;
  readonly Download = Download;
  readonly Layers = Layers;
  readonly RefreshCw = RefreshCw;
  readonly Search = Search;
  readonly ChevronDown = ChevronDown;
  readonly UserPlus = UserPlus;
  readonly UserCheck = UserCheck;
  readonly Clock = Clock;
  readonly ShieldCheck = ShieldCheck;
  readonly Eye = Eye;
  readonly XCircle = XCircle;
  readonly X = X;
  readonly ArrowRight = ArrowRight;
}
