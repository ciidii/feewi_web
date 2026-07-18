import {Component, computed, inject, OnDestroy, OnInit, signal, ViewEncapsulation} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  Archive,
  Download,
  Edit,
  Eye,
  Filter,
  LucideAngularModule,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserPlus,
  Users,
  XCircle
} from 'lucide-angular';
import {debounceTime, distinctUntilChanged, firstValueFrom, Subject, takeUntil} from 'rxjs';
import {StudentRegistryService} from '../../../../../core/services/student-registry.service';
import {AcademicService} from '../../../../../core/services/academic.service';
import {NotificationService} from '../../../../../shared/services/notification.service';
import {LoadingService} from '../../../../../shared/services/loading.service';
import {MatDialog} from '@angular/material/dialog';
import {StudentResponse, StudentStatus, StudentSummary} from '../../../../../core/models/student.model';
import {Page} from '../../../../../core/models/school.model';
import {DataListComponent} from '../../../../../shared/components/data-list/data-list.component';
import {RowAction, TabItem, TableRow} from '../../../../../shared/models/data-list.models';
import {ConfirmDialogComponent} from '../../../../../shared/components/confirm-dialog/confirm-dialog';
import {SchoolClass} from '../../../../../core/models/academic.model';
import {FwPageShellComponent} from '../../../../../shared/components/page-shell/page-shell.component';
import {FwButtonComponent} from '../../../../../shared/components/button/button.component';
import {FwTab} from '../../../../../shared/components/tabs/tabs.component';
import {FwListCommandBarComponent} from '../../../../../shared/components/list-command-bar/list-command-bar.component';
import {SharedFilterModalComponent} from '../../../../../shared/components/filter-modal/shared-filter-modal.component';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    DataListComponent,
    FwPageShellComponent,
    FwButtonComponent,
    FwListCommandBarComponent
  ],
  templateUrl: './student-list.component.html',
  styleUrls: ['./student-list.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class StudentListComponent implements OnInit, OnDestroy {
  private studentService = inject(StudentRegistryService);
  private academicService = inject(AcademicService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);
  protected loadingService = inject(LoadingService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  // --- ÉTATS ---
  activeTabId = signal('ACTIVE');
  searchQuery = signal('');
  selectedStatus = signal<StudentStatus | undefined>('ACTIVE');

  // Données de référence pour les filtres
  classes = signal<SchoolClass[]>([]);
  selectedClassId = signal<string>('');

  activeFilterChips = computed(() => {
    const chips: any[] = [];
    if (this.searchQuery()) chips.push({ key: 'q', label: 'Recherche', value: this.searchQuery() });
    if (this.selectedClassId()) {
      const cls = this.classes().find(c => c.id === this.selectedClassId());
      if (cls) chips.push({ key: 'class', label: 'Classe', value: cls.fullName });
    }
    return chips;
  });

  studentPage = signal<Page<StudentSummary> | null>(null);
  studentRows = computed<TableRow[]>(() => {
    return (this.studentPage()?.content || []).map(student => {
      const initials = (student.firstName?.[0] || '') + (student.lastName?.[0] || '');
      return {
        id: student.id,
        title: `${student.firstName} ${student.lastName.toUpperCase()}`,
        subtitle: student.registrationNumber,
        avatarLabel: initials || '??',
        date: student.birthDate,
        badges: [
          { label: student.status, type: student.status === 'ACTIVE' ? 'success' : 'warning' }
        ],
        rawData: student
      };
    });
  });

  studentTabs = computed<FwTab[]>(() => [
    { label: 'Tous', id: 'ALL', icon: Users, count: this.studentPage()?.totalElements || 0 },
    { label: 'Actifs', id: 'ACTIVE', icon: Users },
    { label: 'Suspendus', id: 'SUSPENDED', icon: XCircle },
    { label: 'Quitté', id: 'LEFT', icon: Archive }
  ]);

  readonly studentActions: RowAction[] = [
    { id: 'view', label: 'Voir le dossier', icon: Eye, type: 'primary' },
    { id: 'edit', label: 'Modifier', icon: Edit, type: 'primary' },
    { id: 'suspend', label: 'Suspendre', icon: XCircle, type: 'danger', hideIf: (row) => row.rawData.status !== 'ACTIVE' }
  ];

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  readonly Search = Search;
  readonly Filter = Filter;
  readonly Download = Download;
  readonly UserPlus = UserPlus;
  readonly RefreshCw = RefreshCw;

  ngOnInit() {
    this.loadClasses();

    // Le lien sidebar "Dossiers scolaires" pointe vers cette même route avec ?status=LEFT.
    // Comme Angular réutilise l'instance du composant entre navigations sur le même chemin,
    // on s'abonne (pas juste un snapshot) pour réagir même sans recréation du composant.
    this.activatedRoute.queryParamMap.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      const requested = params.get('status') as StudentStatus | null;
      const validStatuses: StudentStatus[] = ['ACTIVE', 'SUSPENDED', 'LEFT'];
      const status = requested && validStatuses.includes(requested) ? requested : 'ACTIVE';
      this.activeTabId.set(status);
      this.selectedStatus.set(status);
      this.loadStudents(this.searchQuery(), this.selectedStatus());
    });

    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.loadStudents(query, this.selectedStatus());
    });
  }

  private async loadClasses() {
    try {
      const year = await firstValueFrom(this.academicService.getCurrentYear());
      const classes = await firstValueFrom(this.academicService.getClassesByYear(year.id));
      this.classes.set(classes);
    } catch (e) {
      console.error(e);
    }
  }

  async loadStudents(query?: string, status?: StudentStatus, page: number = 0) {
    await this.loadingService.execute(async () => {
      try {
        const res = await firstValueFrom(this.studentService.getStudents(query, status, this.selectedClassId() || undefined, page));
        this.studentPage.set(res);
      } catch (e) {
        this.notificationService.error('Erreur lors du chargement des élèves.');
      }
    }, 'component');
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
    this.searchSubject.next(query);
  }

  onTabChange(tabId: string) {
    this.activeTabId.set(tabId);
    this.selectedStatus.set(tabId === 'ALL' ? undefined : tabId as StudentStatus);
    this.loadStudents(this.searchQuery(), this.selectedStatus());
  }

  openFilterModal() {
    const dialogRef = this.dialog.open(SharedFilterModalComponent, {
      width: '400px',
      data: {
        title: 'Filtrer les élèves',
        fields: [
          {
            key: 'classId',
            label: 'Filtrer par classe',
            type: 'select',
            options: this.classes().map(c => ({ label: c.fullName, value: c.id }))
          }
        ],
        initialValues: {
          classId: this.selectedClassId()
        }
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.selectedClassId.set(result.classId);
        this.loadStudents(this.searchQuery(), this.selectedStatus());
      }
    });
  }

  removeFilter(key: string) {
    if (key === 'q') this.searchQuery.set('');
    if (key === 'class') this.selectedClassId.set('');
    this.loadStudents(this.searchQuery(), this.selectedStatus());
  }

  clearAllFilters() {
    this.searchQuery.set('');
    this.selectedClassId.set('');
    this.loadStudents(this.searchQuery(), this.selectedStatus());
  }

  handleAction(event: { actionId: string, row: TableRow }) {
    const id = event.row.id as string;
    switch (event.actionId) {
      case 'view':
        this.router.navigate(['/admin/registry/students', id]);
        break;
      case 'edit':
        this.router.navigate(['/admin/registry/students', id, 'edit']);
        break;
      case 'suspend':
        this.confirmSuspend(id, event.row.title);
        break;
    }
  }

  private async confirmSuspend(id: string, name: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Suspendre l\'élève ?',
        message: `Voulez-vous suspendre "${name}" ? L'élève ne figurera plus sur les listes actives.`,
        confirmLabel: 'Suspendre',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(async confirmed => {
      if (confirmed) {
        await this.loadingService.execute(async () => {
          try {
            await firstValueFrom(this.studentService.updateStudent(id, {status: 'SUSPENDED'}));
            this.notificationService.success('Élève suspendu avec succès.');
            this.loadStudents(this.searchQuery(), this.selectedStatus());
          } catch (e) {
            this.notificationService.error('Échec de la suspension.');
          }
        }, 'global');
      }
    });
  }

  protected readonly Users = Users;
}
