import { Component, inject, signal, ViewEncapsulation, OnInit, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule, Filter, Download, UserPlus, Search, Eye, UserMinus, UserCheck, ShieldAlert, GraduationCap, History } from 'lucide-angular';
import { firstValueFrom, Subject, debounceTime, distinctUntilChanged, takeUntil, finalize } from 'rxjs';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { DataListComponent } from '../../../../../shared/components/data-list/data-list.component';
import { RowAction, TabItem, TableRow } from '../../../../../shared/models/data-list.models';
import { StudentRegistryService } from '../../../../../core/services/student-registry.service';
import { StudentSummary, StudentStatus } from '../../../../../core/models/student.model';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog';
import { NotificationService } from '../../../../../shared/services/notification.service';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [CommonModule, DataListComponent, LucideAngularModule, MatMenuModule, MatDialogModule],
  templateUrl:  './student-list.component.html',
  styleUrl: './student-list.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class StudentListComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private studentService = inject(StudentRegistryService);
  private dialog = inject(MatDialog);
  private notificationService = inject(NotificationService);

  // --- ICONS ---
  readonly Filter = Filter;
  readonly Download = Download;
  readonly UserPlus = UserPlus;
  readonly Search = Search;
  readonly GraduationCap = GraduationCap;

  // --- ÉTATS ---
  activeTab = signal('Tous');
  searchQuery = signal('');
  isLoading = signal(false);

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // --- DONNÉES ---
  // On utilise directement le signal du service pour la pagination
  readonly studentPage = this.studentService.studentsPage;

  readonly studentRows = computed(() => {
    const page = this.studentPage();
    if (!page) return [];
    return page.content.map(student => this.mapToTableRow(student));
  });

  // --- CONFIGURATION UI ---
  readonly studentActions: RowAction[] = [
    { id: 'view', label: 'Voir le dossier', icon: Eye, type: 'primary' },
    { id: 'suspend', label: 'Suspendre', icon: UserMinus, type: 'warning' },
    { id: 'history', label: 'Historique', icon: History, type: 'default' }
  ];

  readonly studentTabs = computed<TabItem[]>(() => {
    const page = this.studentPage();
    const total = page?.totalElements || 0;
    return [
      { label: 'Tous', icon: GraduationCap, count: total },
      { label: 'Actifs', icon: UserCheck, count: undefined },
      { label: 'Suspendus', icon: ShieldAlert, count: undefined }
    ];
  });

  async ngOnInit() {
    await this.loadStudents();

    // Setup search debounce
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

  onSearchChange(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.searchQuery.set(query);
    this.searchSubject.next(query);
  }

  async loadStudents(query?: string, status?: StudentStatus, page: number = 0) {
    this.isLoading.set(true);
    try {
      await firstValueFrom(this.studentService.getStudents(query, status, page));
    } catch (e) {
      console.error('Erreur lors du chargement des élèves:', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  private mapToTableRow(student: StudentSummary): TableRow {
    const initials = (student.firstName?.[0] || '') + (student.lastName?.[0] || '');
    return {
      id: student.id,
      title: `${student.firstName} ${student.lastName.toUpperCase()}`,
      subtitle: `Matricule : ${student.registrationNumber}`,
      avatarLabel: initials || '??',
      date: `Né(e) le ${new Date(student.birthDate).toLocaleDateString()}`,
      badges: [
        { label: this.getStatusLabel(student.status), type: this.getStatusType(student.status) },
        { label: student.gender === 'M' ? 'Masculin' : 'Féminin', type: 'default' }
      ]
    };
  }

  private getStatusLabel(status: StudentStatus): string {
    const labels: Record<StudentStatus, string> = {
      'ACTIVE': 'Actif',
      'SUSPENDED': 'Suspendu',
      'LEFT': 'Sorti',
      'ARCHIVED': 'Archivé'
    };
    return labels[status] || status;
  }

  private getStatusType(status: StudentStatus): 'success' | 'warning' | 'danger' | 'info' | 'primary' {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'SUSPENDED': return 'warning';
      case 'LEFT': return 'danger';
      case 'ARCHIVED': return 'info';
      default: return 'primary';
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
      this.router.navigate(['/admin/registry/students', event.row.id]);
    } else if (event.actionId === 'suspend') {
      this.handleQuickSuspend(event.row.id.toString());
    }
  }

  private handleQuickSuspend(id: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Suspendre l\'élève',
        message: 'L\'élève ne sera plus considéré comme actif pour cette année scolaire. Confirmer ?',
        confirmLabel: 'Suspendre',
        type: 'warning'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.isLoading.set(true);
        this.studentService.updateStudent(id, { status: 'SUSPENDED' }).pipe(
          finalize(() => this.isLoading.set(false))
        ).subscribe(() => {
          this.loadStudents(this.searchQuery());
        });
      }
    });
  }
}
