import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  LucideAngularModule,
  ArrowLeft, Calendar, Clock,
  CheckCircle, Plus, LayoutDashboard,
  ListTodo, Palmtree, ChevronRight,
  MoreVertical, Edit, Trash2, Printer, Play, Archive, RotateCcw, XCircle
} from 'lucide-angular';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {AcademicService} from '../../../../../core/services/academic.service';
import {NotificationService} from '../../../../../shared/services/notification.service';
import {AcademicYear, Holiday, Period} from '../../../../../core/models/academic.model';
import {ConfirmDialogComponent} from '../../../../../shared/components/confirm-dialog/confirm-dialog';

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
  imports: [CommonModule, LucideAngularModule, RouterModule, MatDialogModule],
  templateUrl: './year-detail.component.html',
  styleUrls: ['./year-detail.component.scss']
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
  activeTab = signal('timeline');

  // Construction de la Timeline
  timelineEvents = computed<TimelineEvent[]>(() => {
    const events: TimelineEvent[] = [];
    const pList = this.periods();
    const hList = this.holidays();

    pList.forEach(p => {
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

    hList.forEach(h => {
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
        this.academicService.getYearById(id),
        this.academicService.getPeriods(id),
        this.academicService.getHolidays(id)
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
      try {
        await this.academicService.activateYear(y.id);
        this.notificationService.success(`L'année ${y.label} est désormais active.`);
        this.loadYearDetails(y.id);
      } catch (e) {
        this.notificationService.error("Échec de l'activation.");
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
      try {
        await this.academicService.closeYear(y.id);
        this.notificationService.success(`Année ${y.label} en cours de clôture.`);
        this.loadYearDetails(y.id);
      } catch (e) {
        this.notificationService.error("Échec de la clôture.");
      }
    }
  }

  async onReopen() {
    const y = this.year();
    if (!y) return;

    try {
      await this.academicService.reopenYear(y.id);
      this.notificationService.info(`L'année ${y.label} a été rouverte.`);
      this.loadYearDetails(y.id);
    } catch (e) {
      this.notificationService.error("Échec de la réouverture.");
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
      try {
        await this.academicService.archiveYear(y.id);
        this.notificationService.success(`L'année ${y.label} est maintenant archivée.`);
        this.loadYearDetails(y.id);
      } catch (e) {
        this.notificationService.error("Échec de l'archivage.");
      }
    }
  }

  private confirmAction(title: string, message: string, confirmLabel: string, type: 'info' | 'warning' | 'danger'): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: { title, message, confirmLabel, type }
    });
    return new Promise(resolve => dialogRef.afterClosed().subscribe(res => resolve(!!res)));
  }

  setTab(tab: string) {
    this.activeTab.set(tab);
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

  getBadgeType(status?: string): string {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PLANNING': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CLOSING': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ARCHIVED': return 'bg-slate-100 text-slate-600 border-slate-300';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  }
}
