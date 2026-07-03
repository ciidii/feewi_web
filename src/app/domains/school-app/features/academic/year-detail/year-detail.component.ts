import {Component, computed, inject, LOCALE_ID, OnInit, signal, ViewEncapsulation} from '@angular/core';
import {CommonModule, formatDate} from '@angular/common';
import {ActivatedRoute, RouterModule} from '@angular/router';
import {
  Archive,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  LayoutDashboard,
  LucideAngularModule,
  ChevronRight,
  MoreVertical,
  Play,
  Plus,
  Printer,
  RotateCcw,
  Trash2,
  XCircle,
  Globe,
  BookOpen,
  Hash,
  ListChecks,
  Sparkles,
  Zap,
  CalendarDays
} from 'lucide-angular';
import {MilestoneFormComponent} from './components/milestone-form/milestone-form.component';
import {RowAction, TableRow} from '../../../../../shared/models/data-list.models';
import {AcademicMilestone, AcademicYear} from '../../../../../core/models/academic.model';
import {AcademicService} from '../../../../../core/services/academic.service';
import {NotificationService} from '../../../../../shared/services/notification.service';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {DataListComponent} from '../../../../../shared/components/data-list/data-list.component';
import {ConfirmDialogComponent} from '../../../../../shared/components/confirm-dialog/confirm-dialog';
import {firstValueFrom} from 'rxjs';
import {FwPageShellComponent} from '../../../../../shared/components/page-shell/page-shell.component';
import {FwTab} from '../../../../../shared/components/tabs/tabs.component';
import {FwBadgeComponent} from '../../../../../shared/components/badge/badge.component';
import {FwButtonComponent} from '../../../../../shared/components/button/button.component';
import {BlockLoaderComponent} from '../../../../../shared/components/loader/block-loader.component';
import {MatMenuModule} from '@angular/material/menu';
import {AuthService} from '../../../../../core/services/auth.service';
import {HasPermissionDirective} from '../../../../../shared/directives/has-permission.directive';

export interface TimelineEvent {
  id: string;
  type: 'PERIOD' | 'HOLIDAY' | 'EXAM' | 'MILESTONE';
  label: string;
  startDate: string;
  endDate: string;
  description?: string;
  isClosed?: boolean;
  milestoneType?: string;
}

@Component({
  selector: 'app-year-detail',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    RouterModule,
    MatDialogModule,
    MatMenuModule,
    DataListComponent,
    FwPageShellComponent,
    FwBadgeComponent,
    FwButtonComponent,
    BlockLoaderComponent,
    HasPermissionDirective
  ],
  templateUrl: './year-detail.component.html',
  styleUrls: ['./year-detail.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class YearDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private academicService = inject(AcademicService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);
  private locale = inject(LOCALE_ID);

  // États
  year = signal<AcademicYear | null>(null);
  milestones = signal<AcademicMilestone[]>([]);
  isLoading = signal(true);
  isActionLoading = signal(false);
  activeTabId = signal('timeline');

  readonly canManageLifecycle = computed(() => this.authService.hasPermission('academic:year:lifecycle'));
  readonly canEditCalendar = computed(() => this.authService.hasPermission('academic:year:write'));

  // Configuration des Onglets (Architecture V2)
  readonly yearTabs: FwTab[] = [
    {id: 'timeline', label: 'Vue Chronologique', icon: LayoutDashboard},
    {id: 'calendar', label: 'Gestion du Calendrier', icon: CalendarDays}
  ];

  // Actions pour les jalons
  readonly milestoneActions: RowAction[] = [
    {id: 'edit', label: 'Modifier', icon: Edit, type: 'primary', permission: 'academic:year:write'},
    {id: 'delete', label: 'Supprimer', icon: Trash2, type: 'danger', permission: 'academic:year:write'}
  ];

  // Transformation des Jalons pour le DataList
  displayMilestones = computed<TableRow[]>(() => {
    return this.milestones().map(m => ({
      id: m.id,
      title: m.label,
      subtitle: this.getMilestoneDescription(m.type),
      avatarLabel: m.type.substring(0, 2).toUpperCase(),
      date: `${this.formatDateShort(m.startDate)} - ${this.formatDateShort(m.endDate)}`,
      badges: [
        {label: this.getMilestoneLabel(m.type), type: this.getMilestoneBadgeType(m.type)}
      ],
      rawData: m
    }));
  });

  // Construction de la Timeline (V2)
  timelineEvents = computed<TimelineEvent[]>(() => {
    return this.milestones()
      .map(m => ({
        id: m.id,
        type: 'MILESTONE' as const,
        label: m.label,
        startDate: m.startDate,
        endDate: m.endDate,
        milestoneType: m.type,
        description: this.getMilestoneDescription(m.type)
      }))
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  });

  private getMilestoneLabel(type: string): string {
    switch (type) {
      case 'ENROLLMENT': return 'Admission';
      case 'RE_ENROLLMENT': return 'Réinscription';
      case 'LESSONS': return 'Enseignement';
      case 'EXAMS': return 'Examens';
      case 'VACATION': return 'Vacances';
      case 'COMMENCEMENT': return 'Remise';
      default: return type;
    }
  }

  private getMilestoneBadgeType(type: string): any {
    switch (type) {
      case 'LESSONS': return 'info';
      case 'ENROLLMENT':
      case 'RE_ENROLLMENT': return 'success';
      case 'EXAMS': return 'warning';
      case 'VACATION': return 'danger';
      case 'COMMENCEMENT': return 'info';
      default: return 'default';
    }
  }

  private getMilestoneDescription(type: string): string {
    switch (type) {
      case 'ENROLLMENT': return 'Période d\'inscription des nouveaux élèves';
      case 'RE_ENROLLMENT': return 'Campagne de réinscription des élèves actuels';
      case 'LESSONS': return 'Période effective des cours';
      case 'EXAMS': return 'Sessions d\'examens nationaux ou blancs';
      case 'VACATION': return 'Période de fermeture de l\'établissement';
      case 'COMMENCEMENT': return 'Cérémonie de remise des diplômes';
      default: return 'Jalon institutionnel';
    }
  }

  getMilestoneIcon(type: string): any {
    switch (type) {
      case 'ENROLLMENT': return Globe;
      case 'RE_ENROLLMENT': return RotateCcw;
      case 'LESSONS': return BookOpen;
      case 'EXAMS': return Hash;
      case 'VACATION': return Calendar;
      case 'COMMENCEMENT': return CheckCircle;
      default: return CheckCircle;
    }
  }

  // Icônes
  readonly ArrowLeft = ArrowLeft;
  readonly Calendar = Calendar;
  readonly Clock = Clock;
  readonly CheckCircle = CheckCircle;
  readonly Plus = Plus;
  readonly LayoutDashboard = LayoutDashboard;
  readonly CalendarDays = CalendarDays;
  readonly ChevronRight = ChevronRight;
  readonly MoreVertical = MoreVertical;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly Printer = Printer;
  readonly Play = Play;
  readonly Archive = Archive;
  readonly RotateCcw = RotateCcw;
  readonly XCircle = XCircle;
  readonly Globe = Globe;
  readonly ListChecks = ListChecks;
  readonly Sparkles = Sparkles;
  readonly Zap = Zap;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadYearDetails(id);
    }
  }

  async loadYearDetails(id: string) {
    this.isLoading.set(true);
    try {
      const [yearData, milestonesData] = await Promise.all([
        firstValueFrom(this.academicService.getYearById(id)),
        firstValueFrom(this.academicService.getMilestones(id))
      ]);

      this.year.set(yearData);
      this.milestones.set(milestonesData);
    } catch (error) {
      this.notificationService.error("Erreur lors du chargement des détails de l'année.");
    } finally {
      this.isLoading.set(false);
    }
  }

  // --- ACTIONS JALONS (V2) ---

  handleMilestoneAction(event: { actionId: string, row: TableRow }) {
    if (event.actionId === 'edit') {
      this.openMilestoneForm(event.row.rawData);
    } else if (event.actionId === 'delete') {
      this.confirmDeleteMilestone(event.row.id as string, event.row.title);
    }
  }

  openMilestoneForm(milestone?: AcademicMilestone) {
    const dialogRef = this.dialog.open(MilestoneFormComponent, {
      width: '560px',
      maxWidth: '95vw',
      panelClass: 'feewi-dialog-panel',
      data: {
        year: this.year(),
        milestone: milestone
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.year()) {
        this.loadYearDetails(this.year()!.id);
      }
    });
  }

  private async confirmDeleteMilestone(id: string, name: string) {
    const confirmed = await this.confirmAction(
      'Supprimer le jalon ?',
      `Voulez-vous supprimer "${name}" du calendrier ?`,
      'Oui, supprimer',
      'danger'
    );

    if (confirmed && this.year()) {
      try {
        await firstValueFrom(this.academicService.deleteMilestone(this.year()!.id, id));
        this.notificationService.success('Jalon supprimé.');
        this.loadYearDetails(this.year()!.id);
      } catch (e) {
        this.notificationService.error("Échec de la suppression.");
      }
    }
  }

  // ===========================================
  // FACTORY AUTOMATION (V2)
  // ===========================================

  async onGenerateCalendar(strategy: 'TEMPLATE' | 'AUTO') {
    const y = this.year();
    if (!y) return;

    const confirmed = await this.confirmAction(
      strategy === 'TEMPLATE' ? 'Importer le calendrier officiel ?' : 'Générer automatiquement ?',
      strategy === 'TEMPLATE'
        ? 'Cela copiera les dates officielles (Sénégal) pour cette année scolaire. Les jalons existants seront conservés.'
        : 'Cela découpera l\'année en périodes égales selon votre système (Trimestre/Semestre).',
      'Confirmer la génération',
      'info'
    );

    if (confirmed) {
      this.isActionLoading.set(true);
      try {
        await firstValueFrom(this.academicService.generateCalendar(y.id, strategy, strategy === 'TEMPLATE' ? 'SN_OFFICIAL_2026_2027' : undefined));
        this.notificationService.success('Le calendrier a été généré avec succès.');
        this.loadYearDetails(y.id);
      } catch (e) {
        this.notificationService.error("Échec de la génération automatique.");
      } finally {
        this.isActionLoading.set(false);
      }
    }
  }

  // ===========================================
  // ACTIONS DE CYCLE DE VIE (WORKFLOW V2)
  // ===========================================

  async onActivate() {
    const y = this.year();
    if (!y) return;

    const confirmed = await this.confirmAction(
      'Activer l\'année ?',
      `L'année ${y.label} deviendra l'année par défaut. L'ancienne année active sera archivée.`,
      'Oui, activer',
      'info'
    );

    if (confirmed) {
      this.isActionLoading.set(true);
      try {
        await firstValueFrom(this.academicService.activateYear(y.id));
        this.notificationService.success(`L'année ${y.label} est désormais active.`);
        this.loadYearDetails(y.id);
      } catch (e) {
        this.notificationService.error("Échec de l'activation.");
      } finally {
        this.isActionLoading.set(false);
      }
    }
  }

  async onClose() {
    const y = this.year();
    if (!y) return;

    const confirmed = await this.confirmAction(
      'Clôturer l\'année ?',
      `Cette action verrouille le calendrier et prépare la fin d'année. Les cours seront considérés comme terminés.`,
      'Oui, clôturer',
      'warning'
    );

    if (confirmed) {
      this.isActionLoading.set(true);
      try {
        await firstValueFrom(this.academicService.closeYear(y.id));
        this.notificationService.success(`Année ${y.label} en cours de clôture.`);
        this.loadYearDetails(y.id);
      } catch (e) {
        this.notificationService.error("Échec de la clôture.");
      } finally {
        this.isActionLoading.set(false);
      }
    }
  }

  async onReopen() {
    const y = this.year();
    if (!y) return;

    this.isActionLoading.set(true);
    try {
      await firstValueFrom(this.academicService.reopenYear(y.id));
      this.notificationService.info(`L'année ${y.label} a été rouverte.`);
      this.loadYearDetails(y.id);
    } catch (e) {
      this.notificationService.error("Échec de la réouverture.");
    } finally {
      this.isActionLoading.set(false);
    }
  }

  async onArchive() {
    const y = this.year();
    if (!y) return;

    const confirmed = await this.confirmAction(
      'Archivage définitif ?',
      `ATTENTION : L'archivage est irréversible. L'année passera en lecture seule définitivement.`,
      'Oui, archiver définitivement',
      'danger'
    );

    if (confirmed) {
      this.isActionLoading.set(true);
      try {
        await firstValueFrom(this.academicService.archiveYear(y.id));
        this.notificationService.success(`L'année ${y.label} est maintenant archivée.`);
        this.loadYearDetails(y.id);
      } catch (e) {
        this.notificationService.error("Échec de l'archivage.");
      } finally {
        this.isActionLoading.set(false);
      }
    }
  }

  private confirmAction(title: string, message: string, confirmLabel: string, type: 'info' | 'warning' | 'danger'): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {title, message, confirmLabel, type}
    });
    return new Promise(resolve => dialogRef.afterClosed().subscribe(res => resolve(!!res)));
  }

  formatDate(date?: string): string {
    if (!date) return '—';
    return formatDate(date, 'd MMMM yyyy', this.locale);
  }

  formatDateShort(date: string): string {
    return formatDate(date, 'd MMM', this.locale);
  }

  getDuration(year: AcademicYear): string {
    const start = new Date(year.startDate);
    const end = new Date(year.endDate);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    return `${months} Mois`;
  }
}
