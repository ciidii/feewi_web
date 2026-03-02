import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Calendar, Plus, Play, Archive, CheckCircle, Clock } from 'lucide-angular';
import {DataListComponent} from '../../../../../shared/components/data-list/data-list.component';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {AcademicService} from '../../../../../core/services/academic.service';
import {NotificationService} from '../../../../../shared/services/notification.service';
import {AcademicYear, YearStatus} from '../../../../../core/models/academic.model';
import {RowAction, TabItem, TableRow} from '../../../../../shared/models/data-list.models';
import { YearFormComponent } from './components/year-form/year-form.component';
import {ConfirmDialogComponent} from '../../../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-year-list',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, DataListComponent, MatDialogModule],
  templateUrl: './year-list.component.html',
  styleUrls: ['./year-list.component.scss']
})
export class YearListComponent implements OnInit {
  private academicService = inject(AcademicService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);

  // États
  years = signal<AcademicYear[]>([]);
  isLoading = signal(true);
  activeTab = signal('Tous');

  // Icônes
  readonly Calendar = Calendar;
  readonly Plus = Plus;

  // Actions dynamiques basées sur le statut de l'année
  readonly yearActions: RowAction[] = [
    {
      id: 'activate',
      label: 'Activer l\'année',
      icon: Play,
      type: 'success',
      hideIf: (row) => row.metadata?.['status'] !== 'PLANNING'
    },
    {
      id: 'archive',
      label: 'Archiver',
      icon: Archive,
      type: 'warning',
      hideIf: (row) => row.metadata?.['status'] !== 'ACTIVE'
    }
  ];

  tabs: TabItem[] = [
    { label: 'Tous', icon: Calendar, count: 0 },
    { label: 'Active', icon: CheckCircle, count: 0 },
    { label: 'En préparation', icon: Clock, count: 0 }
  ];

  // Transformation des données pour le DataList
  displayYears = computed<TableRow[]>(() => {
    return this.years().map(year => ({
      id: year.id,
      title: year.label,
      subtitle: `${year.systemType} • ${new Date(year.adminStartDate).getFullYear()} - ${new Date(year.adminEndDate).getFullYear()}`,
      avatarLabel: year.label.substring(0, 2),
      date: `Cours: ${new Date(year.lessonsStartDate).toLocaleDateString()} au ${new Date(year.lessonsEndDate).toLocaleDateString()}`,
      badges: [{
        label: year.status,
        type: this.getBadgeType(year.status)
      }],
      metadata: { status: year.status }
    }));
  });

  ngOnInit() {
    this.loadYears();
  }

  async loadYears() {
    this.isLoading.set(true);
    try {
      const data = await this.academicService.getYears();
      this.years.set(data);
      this.updateTabsCount(data);
    } catch (error) {
      this.notificationService.error("Impossible de charger le calendrier scolaire.");
    } finally {
      this.isLoading.set(false);
    }
  }

  private updateTabsCount(data: AcademicYear[]) {
    this.tabs[0].count = data.length;
    this.tabs[1].count = data.filter(y => y.status === 'ACTIVE').length;
    this.tabs[2].count = data.filter(y => y.status === 'PLANNING').length;
  }

  private getBadgeType(status: YearStatus): 'success' | 'warning' | 'info' | 'default' {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'PLANNING': return 'warning';
      case 'ARCHIVED': return 'default';
      case 'CLOSING': return 'info';
      default: return 'default';
    }
  }

  handleAction(event: { actionId: string, row: TableRow }) {
    if (event.actionId === 'activate') {
      this.confirmActivation(event.row);
    }
  }

  private confirmActivation(row: TableRow) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title: 'Activer l\'année scolaire ?',
        message: `Voulez-vous définir "${row.title}" comme l'année de référence ? Cela archivera automatiquement l'année actuellement active.`,
        confirmLabel: 'Oui, activer l\'année',
        type: 'info'
      }
    });

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (confirmed) {
        try {
          // Note: Appeler le service PATCH activate
          this.notificationService.success(`L'année ${row.title} est maintenant active.`);
          this.loadYears();
        } catch (error) {
          this.notificationService.error("Erreur lors de l'activation.");
        }
      }
    });
  }

  openAddYearForm() {
    const dialogRef = this.dialog.open(YearFormComponent, {
      width: '640px',
      maxWidth: '95vw',
      panelClass: 'feewi-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadYears();
      }
    });
  }

  onTabChange(tab: string) {
    this.activeTab.set(tab);
  }
}
