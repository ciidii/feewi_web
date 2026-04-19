import { Component, inject, signal, ViewEncapsulation, OnInit, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule, Filter, Download, UserPlus, Search, Eye, UserMinus, UserCheck, ShieldAlert, GraduationCap, History, Info } from 'lucide-angular';
import { firstValueFrom, Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { DataListComponent } from '../../../../../shared/components/data-list/data-list.component';
import { RowAction, TabItem, TableRow } from '../../../../../shared/models/data-list.models';
import { StudentRegistryService } from '../../../../../core/services/student-registry.service';
import { StudentSummary, StudentStatus } from '../../../../../core/models/student.model';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog';
import { NotificationService } from '../../../../../shared/services/notification.service';
import { LoadingService } from '../../../../../shared/services/loading.service';
import { FwButtonComponent } from '../../../../../shared/components/button/button.component';
import { FwAlertBannerComponent } from '../../../../../shared/components/alert-banner/alert-banner.component';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [
    CommonModule,
    DataListComponent,
    LucideAngularModule,
    MatMenuModule,
    MatDialogModule
  ],
  templateUrl:  './student-list.component.html',
  styleUrl: './student-list.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class StudentListComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private studentService = inject(StudentRegistryService);
  private dialog = inject(MatDialog);
  private notificationService = inject(NotificationService);
  protected loadingService = inject(LoadingService);

  // --- ICONS ---
  readonly Download = Download;
  readonly UserPlus = UserPlus;
  readonly GraduationCap = GraduationCap;
  readonly InfoIcon = Info;

  // --- ÉTATS ---
  activeTab = signal('Tous');
  searchQuery = signal('');

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // --- DONNÉES ---
  readonly studentPage = this.studentService.studentsPage;

  readonly studentRows = computed(() => {
    const page = this.studentPage();
    if (!page) return [];
    return page.content.map(student => this.mapToTableRow(student));
  });

  // --- CONFIGURATION UI (Impératif 4) ---
  readonly studentActions: RowAction[] = [
    { id: 'view', label: 'Dossier complet', icon: Eye, type: 'primary' },
    { id: 'history', label: 'Logs & Historique', icon: History, type: 'default' },
    { id: 'suspend', label: 'Suspendre', icon: UserMinus, type: 'danger' }
  ];

  readonly studentTabs = computed<TabItem[]>(() => {
    const page = this.studentPage();
    const total = page?.totalElements || 0;
    return [
      { label: 'Tous', icon: GraduationCap, count: total },
      { label: 'Actifs', icon: UserCheck },
      { label: 'Suspendus', icon: ShieldAlert }
    ];
  });

  async ngOnInit() {
    await this.loadStudents();

    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.loadStudents(query);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
    this.searchSubject.next(query);
  }

  async loadStudents(query?: string, status?: StudentStatus, page: number = 0) {
    await this.loadingService.execute(async () => {
      try {
        await firstValueFrom(this.studentService.getStudents(query, status, page));
      } catch (e) {
        this.notificationService.error('Erreur lors du chargement des élèves.');
      }
    }, 'component');
  }

  private mapToTableRow(student: StudentSummary): TableRow {
    const initials = (student.firstName?.[0] || '') + (student.lastName?.[0] || '');
    return {
      id: student.id,
      title: `${student.firstName} ${student.lastName.toUpperCase()}`,
      subtitle: student.registrationNumber,
      avatarLabel: initials || '??',
      date: student.birthDate, // Envoyé brut, le Pipe fwDate s'en chargera dans DataList
      badges: [
        { label: this.getStatusLabel(student.status), type: this.getStatusType(student.status) },
        { label: student.gender === 'M' ? 'Garçon' : 'Fille', type: 'info' }
      ],
      rawData: student
    };
  }

  private getStatusLabel(status: StudentStatus): string {
    const labels: Record<StudentStatus, string> = {
      'ACTIVE': 'ACTIF',
      'SUSPENDED': 'SUSPENDU',
      'LEFT': 'SORTI',
      'ARCHIVED': 'ARCHIVÉ'
    };
    return labels[status] || status;
  }

  private getStatusType(status: StudentStatus): 'success' | 'warning' | 'danger' | 'info' | 'default' | 'primary' {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'SUSPENDED': return 'warning';
      case 'LEFT': return 'danger';
      case 'ARCHIVED': return 'info';
      default: return 'default';
    }
  }

  onTabChange(tab: string) {
    this.activeTab.set(tab);
    let status: StudentStatus | undefined;
    if (tab === 'Actifs') status = 'ACTIVE';
    if (tab === 'Suspendus') status = 'SUSPENDED';
    this.loadStudents(this.searchQuery(), status);
  }

  handleAction(event: { actionId: string, row: TableRow }) {
    if (event.actionId === 'view') {
      this.router.navigate(['/school-app/registry/student-detail', event.row.id]);
    } else if (event.actionId === 'suspend') {
      this.handleQuickSuspend(event.row.id.toString(), event.row.title);
    }
  }

  private handleQuickSuspend(id: string, name: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      data: {
        title: 'Suspendre l\'élève',
        message: `Voulez-vous suspendre le dossier de ${name} ? Il ne figurera plus dans les listes actives pour l'année en cours.`,
        confirmLabel: 'Confirmer la suspension',
        type: 'destructive'
      }
    });

    dialogRef.afterClosed().subscribe(async confirmed => {
      if (confirmed) {
        await this.loadingService.execute(async () => {
          try {
            await firstValueFrom(this.studentService.updateStudent(id, { status: 'SUSPENDED' }));
            this.notificationService.success('Élève suspendu avec succès.');
            this.loadStudents(this.searchQuery());
          } catch (e) {
            this.notificationService.error('Échec de la suspension.');
          }
        }, 'global');
      }
    });
  }

  protected readonly Filter = Filter;
  protected readonly Search = Search;
}
