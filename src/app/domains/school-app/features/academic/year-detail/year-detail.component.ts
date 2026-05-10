import {Component, computed, inject, OnInit, signal, ViewEncapsulation} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, RouterModule} from '@angular/router';
import {
  Archive,
  ArrowLeft,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  Edit,
  LayoutDashboard,
  ListTodo,
  LucideAngularModule,
  MoreVertical,
  Palmtree,
  Play,
  Plus,
  Printer,
  RotateCcw,
  Trash2,
  XCircle
} from 'lucide-angular';
import {PeriodFormComponent} from './components/period-form/period-form.component';
import {HolidayFormComponent} from './components/holiday-form/holiday-form.component';
import {RowAction, TableRow} from '../../../../../shared/models/data-list.models';
import {AcademicYear, Holiday, Period} from '../../../../../core/models/academic.model';
import {AcademicService} from '../../../../../core/services/academic.service';
import {NotificationService} from '../../../../../shared/services/notification.service';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {DataListComponent} from '../../../../../shared/components/data-list/data-list.component';
import {ConfirmDialogComponent} from '../../../../../shared/components/confirm-dialog/confirm-dialog';
import {firstValueFrom} from 'rxjs';
import {FwPageShellComponent} from '../../../../../shared/components/page-shell/page-shell.component';
import {FwTab} from '../../../../../shared/components/tabs/tabs.component';
import {FwBadgeComponent} from '../../../../../shared/components/badge/badge.component';

export interface TimelineEvent {
  id: string;
  type: 'PERIOD' | 'HOLIDAY' | 'EXAM';
  label: string;
  startDate: string;
  endDate: string;
  description?: string;
  isClosed?: boolean;
}

@Component({
  selector: 'app-year-detail',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    RouterModule,
    MatDialogModule,
    DataListComponent,
    FwPageShellComponent,
    FwBadgeComponent
  ],
  templateUrl: './year-detail.component.html',
  styleUrls: ['./year-detail.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class YearDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private academicService = inject(AcademicService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);

  // États
  year = signal<AcademicYear | null>(null);
  periods = signal<Period[]>([]);
  holidays = signal<Holiday[]>([]);
  isLoading = signal(true);
  isActionLoading = signal(false);
  activeTabId = signal('timeline');

  // Configuration des Onglets
  readonly yearTabs: FwTab[] = [
    {id: 'timeline', label: 'Vue Chronologique', icon: LayoutDashboard},
    {id: 'periods', label: 'Découpage Pédagogique', icon: ListTodo},
    {id: 'holidays', label: 'Congés & Vacances', icon: Palmtree}
  ];

  // Actions pour les périodes
  readonly periodActions: RowAction[] = [
    {id: 'edit', label: 'Modifier', icon: Edit, type: 'primary'},
    {id: 'delete', label: 'Supprimer', icon: Trash2, type: 'danger'}
  ];

  // Actions pour les vacances
  readonly holidayActions: RowAction[] = [
    {id: 'edit', label: 'Modifier', icon: Edit, type: 'primary'},
    {id: 'delete', label: 'Supprimer', icon: Trash2, type: 'danger'}
  ];

  // Transformation des périodes pour le DataList
  displayPeriods = computed<TableRow[]>(() => {
    return this.periods().map(p => ({
      id: p.id,
      title: p.label,
      subtitle: `Examens du ${this.formatDateShort(p.examStartDate)} au ${this.formatDateShort(p.examEndDate)}`,
      avatarLabel: p.label.substring(0, 2).toUpperCase(),
      date: `Cours: ${this.formatDateShort(p.startDate)} - ${this.formatDateShort(p.endDate)}`,
      badges: [
        {label: 'Session de notes', type: 'info'},
        {label: `Limite: ${this.formatDateShort(p.gradingDeadline)}`, type: 'warning'}
      ],
      rawData: p
    }));
  });

  // Transformation des vacances pour le DataList
  displayHolidays = computed<TableRow[]>(() => {
    return this.holidays().map(h => ({
      id: h.id,
      title: h.label,
      subtitle: h.schoolClosed ? 'Établissement fermé' : 'Établissement ouvert',
      avatarLabel: 'VC',
      date: `${this.formatDateShort(h.startDate)} au ${this.formatDateShort(h.endDate)}`,
      badges: [
        {label: 'CONGÉ', type: h.schoolClosed ? 'danger' : 'success'}
      ],
      rawData: h
    }));
  });

  // Construction de la Timeline
  timelineEvents = computed<TimelineEvent[]>(() => {
    const events: TimelineEvent[] = [];

    this.periods().forEach(p => {
      events.push({
        id: p.id,
        type: 'PERIOD',
        label: p.label,
        startDate: p.startDate,
        endDate: p.endDate,
        description: 'Session d\'enseignement régulier'
      });

      if (p.examStartDate) {
        events.push({
          id: `exam-${p.id}`,
          type: 'EXAM',
          label: `Examens : ${p.label}`,
          startDate: p.examStartDate,
          endDate: p.examEndDate,
          description: `Date limite de saisie des notes : ${this.formatDateShort(p.gradingDeadline)}`
        });
      }
    });

    this.holidays().forEach(h => {
      events.push({
        id: h.id,
        type: 'HOLIDAY',
        label: h.label,
        startDate: h.startDate,
        endDate: h.endDate,
        isClosed: h.schoolClosed
      });
    });

    return events.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  });

  // Icônes
  readonly ArrowLeft = ArrowLeft;
  readonly Calendar = Calendar;
  readonly Clock = Clock;
  readonly CheckCircle = CheckCircle;
  readonly Plus = Plus;
  readonly LayoutDashboard = LayoutDashboard;
  readonly ListTodo = ListTodo;
  readonly Palmtree = Palmtree;
  readonly ChevronRight = ChevronRight;
  readonly MoreVertical = MoreVertical;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly Printer = Printer;
  readonly Play = Play;
  readonly Archive = Archive;
  readonly RotateCcw = RotateCcw;
  readonly XCircle = XCircle;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadYearDetails(id);
    }
  }

  async loadYearDetails(id: string) {
    this.isLoading.set(true);
    try {
      const [yearData, periodsData, holidaysData] = await Promise.all([
        firstValueFrom(this.academicService.getYearById(id)),
        firstValueFrom(this.academicService.getPeriods(id)),
        firstValueFrom(this.academicService.getHolidays(id))
      ]);

      this.year.set(yearData);
      this.periods.set(periodsData);
      this.holidays.set(holidaysData);
    } catch (error) {
      this.notificationService.error("Erreur lors du chargement des détails de l'année.");
    } finally {
      this.isLoading.set(false);
    }
  }

  // --- ACTIONS VACANCES ---

  handleHolidayAction(event: { actionId: string, row: TableRow }) {
    if (event.actionId === 'edit') {
      this.openHolidayForm(event.row.rawData);
    } else if (event.actionId === 'delete') {
      this.confirmDeleteHoliday(event.row.id as string, event.row.title);
    }
  }

  openHolidayForm(holiday?: Holiday) {
    const dialogRef = this.dialog.open(HolidayFormComponent, {
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'feewi-dialog-panel',
      data: {
        year: this.year(),
        holiday: holiday
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.year()) {
        this.loadYearDetails(this.year()!.id);
      }
    });
  }

  private async confirmDeleteHoliday(id: string, name: string) {
    const confirmed = await this.confirmAction(
      'Supprimer le congé ?',
      `Voulez-vous supprimer les vacances "${name}" du calendrier ?`,
      'Oui, supprimer',
      'danger'
    );

    if (confirmed && this.year()) {
      try {
        await this.academicService.deleteHoliday(this.year()!.id, id);
        this.notificationService.success('Congé supprimé.');
        this.loadYearDetails(this.year()!.id);
      } catch (e) {
        this.notificationService.error("Échec de la suppression.");
      }
    }
  }

  // --- ACTIONS PÉRIODES ---

  handlePeriodAction(event: { actionId: string, row: TableRow }) {
    if (event.actionId === 'edit') {
      this.openPeriodForm(event.row.rawData);
    } else if (event.actionId === 'delete') {
      this.confirmDeletePeriod(event.row.id as string, event.row.title);
    }
  }

  openPeriodForm(period?: Period) {
    const dialogRef = this.dialog.open(PeriodFormComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'feewi-dialog-panel',
      data: {
        year: this.year(),
        period: period
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.year()) {
        this.loadYearDetails(this.year()!.id);
      }
    });
  }

  private async confirmDeletePeriod(id: string, name: string) {
    const confirmed = await this.confirmAction(
      'Supprimer la période ?',
      `Voulez-vous supprimer le "${name}" ? Les dates d'examens associées seront également perdues.`,
      'Oui, supprimer',
      'danger'
    );

    if (confirmed && this.year()) {
      try {
        await this.academicService.deletePeriod(this.year()!.id, id);
        this.notificationService.success('Période supprimée.');
        this.loadYearDetails(this.year()!.id);
      } catch (e) {
        this.notificationService.error("Impossible de supprimer cette période.");
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
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  formatDateShort(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  }
}
