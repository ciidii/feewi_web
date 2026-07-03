import {Component, computed, inject, LOCALE_ID, OnInit, signal, ViewEncapsulation} from '@angular/core';
import {CommonModule, formatDate} from '@angular/common';
import {ActivatedRoute, RouterModule} from '@angular/router';
import {
  Archive,
  ArrowLeft,
  Calendar,
  CalendarOff,
  CheckCircle,
  Clock,
  Edit,
  Layers,
  LayoutDashboard,
  LucideAngularModule,
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
import {FwButtonComponent} from '../../../../../shared/components/button/button.component';
import {BlockLoaderComponent} from '../../../../../shared/components/loader/block-loader.component';
import {AuthService} from '../../../../../core/services/auth.service';
import {HasPermissionDirective} from '../../../../../shared/directives/has-permission.directive';

export interface TimelineEvent {
  id: string;
  type: 'PERIOD' | 'HOLIDAY';
  label: string;
  startDate: string;
  endDate: string;
  description: string;
  schoolClosed?: boolean;
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

  year = signal<AcademicYear | null>(null);
  periods = signal<Period[]>([]);
  holidays = signal<Holiday[]>([]);
  isLoading = signal(true);
  isActionLoading = signal(false);
  activeTabId = signal('timeline');

  readonly canManageLifecycle = computed(() => this.authService.hasPermission('academic:year:lifecycle'));

  readonly yearTabs: FwTab[] = [
    {id: 'timeline', label: 'Vue Chronologique', icon: LayoutDashboard},
    {id: 'periods', label: 'Périodes', icon: Layers},
    {id: 'holidays', label: 'Congés', icon: CalendarOff}
  ];

  readonly periodActions: RowAction[] = [
    {id: 'edit', label: 'Modifier', icon: Edit, type: 'primary', permission: 'academic:year:write'},
    {id: 'delete', label: 'Supprimer', icon: Trash2, type: 'danger', permission: 'academic:year:write'}
  ];

  readonly holidayActions: RowAction[] = [
    {id: 'edit', label: 'Modifier', icon: Edit, type: 'primary', permission: 'academic:year:write'},
    {id: 'delete', label: 'Supprimer', icon: Trash2, type: 'danger', permission: 'academic:year:write'}
  ];

  displayPeriods = computed<TableRow[]>(() =>
    this.periods().map(p => ({
      id: p.id,
      title: p.label,
      subtitle: `${this.formatDate(p.startDate)} → ${this.formatDate(p.endDate)}`,
      avatarLabel: p.label.substring(0, 2).toUpperCase(),
      badges: [{label: 'PÉRIODE', type: 'info' as any}],
      rawData: p
    }))
  );

  displayHolidays = computed<TableRow[]>(() =>
    this.holidays().map(h => ({
      id: h.id,
      title: h.label,
      subtitle: `${this.formatDate(h.startDate)} → ${this.formatDate(h.endDate)}`,
      avatarLabel: h.label.substring(0, 2).toUpperCase(),
      badges: [{label: h.schoolClosed ? 'FERMÉ' : 'CONGÉ', type: (h.schoolClosed ? 'danger' : 'warning') as any}],
      rawData: h
    }))
  );

  readonly closedHolidaysCount = computed(() => this.holidays().filter(h => h.schoolClosed).length);

  timelineEvents = computed<TimelineEvent[]>(() => {
    const periodEvents: TimelineEvent[] = this.periods().map(p => ({
      id: p.id,
      type: 'PERIOD' as const,
      label: p.label,
      startDate: p.startDate,
      endDate: p.endDate,
      description: `${this.formatDate(p.startDate)} → ${this.formatDate(p.endDate)}`
    }));
    const holidayEvents: TimelineEvent[] = this.holidays().map(h => ({
      id: h.id,
      type: 'HOLIDAY' as const,
      label: h.label,
      startDate: h.startDate,
      endDate: h.endDate,
      description: h.schoolClosed ? 'Établissement fermé' : 'Suspension de cours',
      schoolClosed: h.schoolClosed
    }));
    return [...periodEvents, ...holidayEvents]
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  });

  // Icônes
  readonly ArrowLeft = ArrowLeft;
  readonly Calendar = Calendar;
  readonly CalendarOff = CalendarOff;
  readonly CheckCircle = CheckCircle;
  readonly Clock = Clock;
  readonly Edit = Edit;
  readonly Layers = Layers;
  readonly LayoutDashboard = LayoutDashboard;
  readonly Play = Play;
  readonly Plus = Plus;
  readonly Printer = Printer;
  readonly RotateCcw = RotateCcw;
  readonly Trash2 = Trash2;
  readonly XCircle = XCircle;
  readonly Archive = Archive;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadYearDetails(id);
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
    } catch {
      this.notificationService.error("Erreur lors du chargement des détails de l'année.");
    } finally {
      this.isLoading.set(false);
    }
  }

  // ===========================================
  // ACTIONS PÉRIODES
  // ===========================================

  handlePeriodAction(event: { actionId: string, row: TableRow }) {
    if (event.actionId === 'edit') this.openPeriodForm(event.row.rawData as Period);
    else if (event.actionId === 'delete') this.confirmDeletePeriod(event.row.id as string, event.row.title);
  }

  openPeriodForm(period?: Period) {
    const ref = this.dialog.open(PeriodFormComponent, {
      width: '480px', maxWidth: '95vw', panelClass: 'feewi-dialog-panel',
      data: {year: this.year(), period}
    });
    ref.afterClosed().subscribe(ok => { if (ok && this.year()) this.loadYearDetails(this.year()!.id); });
  }

  private async confirmDeletePeriod(id: string, name: string) {
    const ok = await this.confirmAction('Supprimer la période ?', `"${name}" sera retirée du calendrier.`, 'Supprimer', 'danger');
    if (ok && this.year()) {
      try {
        await firstValueFrom(this.academicService.deletePeriod(this.year()!.id, id));
        this.notificationService.success('Période supprimée.');
        this.loadYearDetails(this.year()!.id);
      } catch { this.notificationService.error('Échec de la suppression.'); }
    }
  }

  // ===========================================
  // ACTIONS CONGÉS
  // ===========================================

  handleHolidayAction(event: { actionId: string, row: TableRow }) {
    if (event.actionId === 'edit') this.openHolidayForm(event.row.rawData as Holiday);
    else if (event.actionId === 'delete') this.confirmDeleteHoliday(event.row.id as string, event.row.title);
  }

  openHolidayForm(holiday?: Holiday) {
    const ref = this.dialog.open(HolidayFormComponent, {
      width: '480px', maxWidth: '95vw', panelClass: 'feewi-dialog-panel',
      data: {year: this.year(), holiday}
    });
    ref.afterClosed().subscribe(ok => { if (ok && this.year()) this.loadYearDetails(this.year()!.id); });
  }

  private async confirmDeleteHoliday(id: string, name: string) {
    const ok = await this.confirmAction('Supprimer le congé ?', `"${name}" sera retiré du calendrier.`, 'Supprimer', 'danger');
    if (ok && this.year()) {
      try {
        await firstValueFrom(this.academicService.deleteHoliday(this.year()!.id, id));
        this.notificationService.success('Congé supprimé.');
        this.loadYearDetails(this.year()!.id);
      } catch { this.notificationService.error('Échec de la suppression.'); }
    }
  }

  // ===========================================
  // CYCLE DE VIE
  // ===========================================

  async onActivate() {
    const y = this.year();
    if (!y) return;
    const ok = await this.confirmAction(`Activer l'année ${y.label} ?`, "Elle deviendra l'année par défaut.", 'Oui, activer', 'info');
    if (!ok) return;
    this.isActionLoading.set(true);
    try {
      await firstValueFrom(this.academicService.activateYear(y.id));
      this.notificationService.success(`${y.label} est désormais active.`);
      this.loadYearDetails(y.id);
    } catch { this.notificationService.error("Échec de l'activation."); }
    finally { this.isActionLoading.set(false); }
  }

  async onClose() {
    const y = this.year();
    if (!y) return;
    const ok = await this.confirmAction('Clôturer l\'année ?', 'Le calendrier sera verrouillé. Cette action est réversible.', 'Clôturer', 'warning');
    if (!ok) return;
    this.isActionLoading.set(true);
    try {
      await firstValueFrom(this.academicService.closeYear(y.id));
      this.notificationService.success(`${y.label} clôturée.`);
      this.loadYearDetails(y.id);
    } catch { this.notificationService.error('Échec de la clôture.'); }
    finally { this.isActionLoading.set(false); }
  }

  async onReopen() {
    const y = this.year();
    if (!y) return;
    this.isActionLoading.set(true);
    try {
      await firstValueFrom(this.academicService.reopenYear(y.id));
      this.notificationService.info(`${y.label} rouverte.`);
      this.loadYearDetails(y.id);
    } catch { this.notificationService.error('Échec de la réouverture.'); }
    finally { this.isActionLoading.set(false); }
  }

  async onArchive() {
    const y = this.year();
    if (!y) return;
    const ok = await this.confirmAction('Archivage définitif ?', 'ATTENTION : irréversible. L\'année passera en lecture seule.', 'Archiver', 'danger');
    if (!ok) return;
    this.isActionLoading.set(true);
    try {
      await firstValueFrom(this.academicService.archiveYear(y.id));
      this.notificationService.success(`${y.label} archivée.`);
      this.loadYearDetails(y.id);
    } catch { this.notificationService.error("Échec de l'archivage."); }
    finally { this.isActionLoading.set(false); }
  }

  private confirmAction(title: string, message: string, confirmLabel: string, type: 'info' | 'warning' | 'danger'): Promise<boolean> {
    const ref = this.dialog.open(ConfirmDialogComponent, {width: '450px', data: {title, message, confirmLabel, type}});
    return new Promise(resolve => ref.afterClosed().subscribe(res => resolve(!!res)));
  }

  formatDate(date?: string): string {
    if (!date) return '—';
    return formatDate(date, 'd MMM yyyy', this.locale);
  }

  getDuration(year: AcademicYear): string {
    const start = new Date(year.startDate);
    const end = new Date(year.endDate);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    return `${months} mois`;
  }
}
