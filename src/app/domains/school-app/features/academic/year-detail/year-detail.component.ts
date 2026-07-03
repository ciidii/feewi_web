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
import {CalendarEntryFormComponent} from './components/calendar-entry-form/calendar-entry-form.component';
import {RowAction, TableRow} from '../../../../../shared/models/data-list.models';
import {AcademicYear, CalendarEntry} from '../../../../../core/models/academic.model';
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

@Component({
  selector: 'app-year-detail',
  standalone: true,
  imports: [
    CommonModule, LucideAngularModule, RouterModule, MatDialogModule,
    DataListComponent, FwPageShellComponent, FwBadgeComponent,
    FwButtonComponent, BlockLoaderComponent, HasPermissionDirective
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
  entries = signal<CalendarEntry[]>([]);
  isLoading = signal(true);
  isActionLoading = signal(false);
  activeTabId = signal('timeline');

  readonly yearTabs: FwTab[] = [
    {id: 'timeline', label: 'Vue Chronologique', icon: LayoutDashboard},
    {id: 'calendar', label: 'Calendrier', icon: Layers}
  ];

  readonly entryActions: RowAction[] = [
    {id: 'edit', label: 'Modifier', icon: Edit, type: 'primary', permission: 'academic:year:write'},
    {id: 'delete', label: 'Supprimer', icon: Trash2, type: 'danger', permission: 'academic:year:write'}
  ];

  displayEntries = computed<TableRow[]>(() =>
    this.entries().map(e => ({
      id: e.id,
      title: e.label,
      subtitle: `${this.formatDate(e.startDate)} → ${this.formatDate(e.endDate)}`,
      avatarLabel: e.label.substring(0, 2).toUpperCase(),
      badges: [{
        label: e.type === 'COURS' ? 'COURS' : (e.schoolClosed ? 'FERMÉ' : 'CONGÉ'),
        type: (e.type === 'COURS' ? 'info' : e.schoolClosed ? 'danger' : 'warning') as any
      }],
      rawData: e
    }))
  );

  timelineEntries = computed<CalendarEntry[]>(() =>
    [...this.entries()].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
  );

  readonly coursCount = computed(() => this.entries().filter(e => e.type === 'COURS').length);
  readonly congeCount = computed(() => this.entries().filter(e => e.type === 'CONGE').length);

  // Icônes
  readonly ArrowLeft = ArrowLeft; readonly Calendar = Calendar;
  readonly CalendarOff = CalendarOff; readonly CheckCircle = CheckCircle;
  readonly Clock = Clock; readonly Edit = Edit; readonly Layers = Layers;
  readonly LayoutDashboard = LayoutDashboard; readonly Play = Play;
  readonly Plus = Plus; readonly Printer = Printer; readonly RotateCcw = RotateCcw;
  readonly Trash2 = Trash2; readonly XCircle = XCircle; readonly Archive = Archive;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadYearDetails(id);
  }

  async loadYearDetails(id: string) {
    this.isLoading.set(true);
    try {
      const [yearData, entriesData] = await Promise.all([
        firstValueFrom(this.academicService.getYearById(id)),
        firstValueFrom(this.academicService.getCalendarEntries(id))
      ]);
      this.year.set(yearData);
      this.entries.set(entriesData);
    } catch {
      this.notificationService.error("Erreur lors du chargement de l'année scolaire.");
    } finally {
      this.isLoading.set(false);
    }
  }

  // ===========================================
  // ACTIONS CALENDRIER
  // ===========================================

  handleEntryAction(event: { actionId: string, row: TableRow }) {
    if (event.actionId === 'edit') this.openEntryForm(event.row.rawData as CalendarEntry);
    else if (event.actionId === 'delete') this.confirmDelete(event.row.id as string, event.row.title);
  }

  openEntryForm(entry?: CalendarEntry) {
    const ref = this.dialog.open(CalendarEntryFormComponent, {
      width: '520px', maxWidth: '95vw', panelClass: 'feewi-dialog-panel',
      data: {year: this.year(), entry}
    });
    ref.afterClosed().subscribe(ok => { if (ok && this.year()) this.loadYearDetails(this.year()!.id); });
  }

  private async confirmDelete(id: string, name: string) {
    const ok = await this.confirmAction('Supprimer cette entrée ?', `"${name}" sera retirée du calendrier.`, 'Supprimer', 'danger');
    if (ok && this.year()) {
      try {
        await firstValueFrom(this.academicService.deleteCalendarEntry(this.year()!.id, id));
        this.notificationService.success('Entrée supprimée.');
        this.loadYearDetails(this.year()!.id);
      } catch { this.notificationService.error('Échec de la suppression.'); }
    }
  }

  // ===========================================
  // CYCLE DE VIE
  // ===========================================

  async onActivate() {
    const y = this.year(); if (!y) return;
    const ok = await this.confirmAction(`Activer ${y.label} ?`, "Elle deviendra l'année par défaut.", 'Oui, activer', 'info');
    if (!ok) return;
    this.isActionLoading.set(true);
    try { await firstValueFrom(this.academicService.activateYear(y.id)); this.notificationService.success(`${y.label} activée.`); this.loadYearDetails(y.id); }
    catch { this.notificationService.error("Échec de l'activation."); }
    finally { this.isActionLoading.set(false); }
  }

  async onClose() {
    const y = this.year(); if (!y) return;
    const ok = await this.confirmAction('Clôturer l\'année ?', 'Le calendrier sera verrouillé.', 'Clôturer', 'warning');
    if (!ok) return;
    this.isActionLoading.set(true);
    try { await firstValueFrom(this.academicService.closeYear(y.id)); this.notificationService.success(`${y.label} clôturée.`); this.loadYearDetails(y.id); }
    catch { this.notificationService.error('Échec de la clôture.'); }
    finally { this.isActionLoading.set(false); }
  }

  async onReopen() {
    const y = this.year(); if (!y) return;
    this.isActionLoading.set(true);
    try { await firstValueFrom(this.academicService.reopenYear(y.id)); this.notificationService.info(`${y.label} rouverte.`); this.loadYearDetails(y.id); }
    catch { this.notificationService.error('Échec de la réouverture.'); }
    finally { this.isActionLoading.set(false); }
  }

  async onArchive() {
    const y = this.year(); if (!y) return;
    const ok = await this.confirmAction('Archivage définitif ?', 'Irréversible. L\'année passera en lecture seule.', 'Archiver', 'danger');
    if (!ok) return;
    this.isActionLoading.set(true);
    try { await firstValueFrom(this.academicService.archiveYear(y.id)); this.notificationService.success(`${y.label} archivée.`); this.loadYearDetails(y.id); }
    catch { this.notificationService.error("Échec de l'archivage."); }
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
    const s = new Date(year.startDate), e = new Date(year.endDate);
    const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
    return `${months} mois`;
  }
}
