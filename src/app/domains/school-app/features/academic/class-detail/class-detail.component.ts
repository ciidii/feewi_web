import {Component, computed, inject, OnInit, signal, ViewEncapsulation} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {firstValueFrom} from 'rxjs';
import {
  BookOpen,
  Calendar,
  Download,
  Eye,
  GraduationCap,
  History,
  LucideAngularModule,
  Plus,
  RefreshCw,
  School,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X
} from 'lucide-angular';
import {FwPageShellComponent} from '../../../../../shared/components/page-shell/page-shell.component';
import {FwButtonComponent} from '../../../../../shared/components/button/button.component';
import {DataListComponent} from '../../../../../shared/components/data-list/data-list.component';
import {BlockLoaderComponent} from '../../../../../shared/components/loader/block-loader.component';
import {PageProgressComponent} from '../../../../../shared/components/loader/page-progress.component';
import {FwEmptyStateComponent} from '../../../../../shared/components/empty-state/empty-state.component';
import {FwListCommandBarComponent} from '../../../../../shared/components/list-command-bar/list-command-bar.component';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {AcademicService} from '../../../../../core/services/academic.service';
import {StudentRegistryService} from '../../../../../core/services/student-registry.service';
import {IdentityService} from '../../../../../core/services/identity.service';
import {NotificationService} from '../../../../../shared/services/notification.service';
import {SchoolClass, StudentAssignment, Subject, Teaching} from '../../../../../core/models/academic.model';
import {User} from '../../../../../core/models/user.model';
import {FwTab} from '../../../../../shared/components/tabs/tabs.component';
import {RowAction, TableRow} from '../../../../../shared/models/data-list.models';
import {
  TeacherSelectModalComponent
} from '../../../../../shared/components/teacher-select-modal/teacher-select-modal.component';
import {ConfirmDialogComponent} from '../../../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-class-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule,
    FwPageShellComponent,
    FwButtonComponent,
    DataListComponent,
    BlockLoaderComponent,
    FwEmptyStateComponent,
    FwListCommandBarComponent,
    MatDialogModule
  ],
  templateUrl: './class-detail.component.html',
  styleUrls: ['./class-detail.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ClassDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private academicService = inject(AcademicService);
  private studentService = inject(StudentRegistryService);
  private identityService = inject(IdentityService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);

  // Icônes
  readonly School = School;
  readonly Users = Users;
  readonly BookOpen = BookOpen;
  readonly Calendar = Calendar;
  readonly Plus = Plus;
  readonly GraduationCap = GraduationCap;
  readonly History = History;
  readonly UserCheck = UserCheck;
  readonly UserPlus = UserPlus;
  readonly RefreshCw = RefreshCw;
  readonly Eye = Eye;
  readonly Trash2 = Trash2;
  readonly Download = Download;
  readonly X = X;

  // États
  classId = signal<string | null>(null);
  schoolClass = signal<SchoolClass | null>(null);
  assignments = signal<StudentAssignment[]>([]);
  teachings = signal<Teaching[]>([]);
  allSubjects = signal<Subject[]>([]);
  staffList = signal<User[]>([]);
  isLoading = signal(true);
  isActionLoading = signal(false);
  activeTab = signal('students');
  searchQuery = signal('');

  // Configuration des Onglets
  readonly classTabs: FwTab[] = [
    {id: 'students', label: 'Registre des Élèves', icon: Users},
    {id: 'team', label: 'Équipe Pédagogique', icon: UserCheck},
    {id: 'schedule', label: 'Emploi du temps', icon: Calendar}
  ];

  // Actions pour les élèves
  readonly studentActions: RowAction[] = [
    {id: 'view', label: 'Dossier élève', icon: Eye, type: 'primary'},
    {id: 'unassign', label: 'Retirer de la classe', icon: X, type: 'danger'}
  ];

  // Actions pour l'équipe
  readonly teamActions: RowAction[] = [
    {id: 'assign', label: 'Assigner Professeur', icon: UserCheck, type: 'primary'},
    {id: 'remove', label: 'Retirer du programme', icon: Trash2, type: 'danger'}
  ];

  // Calculs réactifs
  richDescription = computed(() => {
    const c = this.schoolClass();
    if (!c) return 'Chargement...';
    return `${c.levelName || 'Niveau'} • ${this.assignments().length}/${c.capacity} Élèves • ${this.teachings().length} Matières`;
  });

  // Transformation des élèves pour DataList (Affectations)
  displayStudents = computed<TableRow[]>(() => {
    return this.assignments()
      .filter(a => !this.searchQuery() || `${a.studentFirstName} ${a.studentLastName}`.toLowerCase().includes(this.searchQuery().toLowerCase()))
      .map(a => {
        const initials = (a.studentFirstName?.[0] || '') + (a.studentLastName?.[0] || '');
        return {
          id: a.id, // ID de l'affectation
          title: `${a.studentFirstName || 'Inconnu'} ${a.studentLastName || ''}`,
          subtitle: `Dossier affecté le ${a.assignedAt ? new Date(a.assignedAt).toLocaleDateString() : '—'}`,
          avatarLabel: initials || '??',
          badges: [
            {label: a.studentGender === 'MALE' ? 'GARÇON' : 'FILLE', type: 'info'},
            {label: 'AFFECTÉ', type: 'success'}
          ],
          rawData: a
        };
      });
  });

  // Transformation de l'équipe pour DataList
  displayTeam = computed<TableRow[]>(() => {
    return this.teachings()
      .filter(t => !this.searchQuery() || (t.subjectName || '').toLowerCase().includes(this.searchQuery().toLowerCase()))
      .map(t => ({
        id: t.id,
        title: t.subjectName || 'Matière',
        subtitle: t.teacherName ? `Professeur: ${t.teacherName}` : 'À pourvoir (Vacant)',
        avatarLabel: (t.subjectName || '??').substring(0, 2).toUpperCase(),
        badges: [
          {label: `COEFF ${t.coefficient}`, type: 'info'},
          {label: t.teacherId ? 'ASSIGNÉ' : 'LIBRE', type: t.teacherId ? 'success' : 'danger'}
        ],
        rawData: t
      }));
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.classId.set(id);
        this.loadData(id);
      }
    });
  }

  async loadData(id: string) {
    this.isLoading.set(true);
    try {
      const [cls, assignments, teachings, subjects] = await Promise.all([
        firstValueFrom(this.academicService.getClassById(id)),
        firstValueFrom(this.academicService.getAssignmentsByClass(id)),
        firstValueFrom(this.academicService.getTeachingsByClass(id)),
        firstValueFrom(this.academicService.getSubjects())
      ]);

      this.schoolClass.set(cls);
      this.assignments.set(assignments);
      this.teachings.set(teachings);
      this.allSubjects.set(subjects);

      // Charger le personnel (ENSEIGNANTS)
      await this.identityService.getStaff('', 0, 100, 'TEACHER');
      const staffPage = this.identityService.staffPage();
      if (staffPage) this.staffList.set(staffPage.content);

    } catch (error) {
      this.notificationService.error("Impossible de charger les détails de la classe.");
    } finally {
      this.isLoading.set(false);
    }
  }

  setTab(tab: string) {
    this.activeTab.set(tab);
    this.searchQuery.set('');
  }

  handleStudentAction(event: { actionId: string, row: TableRow }) {
    if (event.actionId === 'view') {
      const assignment = event.row.rawData as StudentAssignment;
      this.router.navigate(['/admin/registry/students', assignment.studentId]);
    } else if (event.actionId === 'unassign') {
      this.handleUnassignStudent(event.row.rawData as StudentAssignment);
    }
  }

  private async handleUnassignStudent(a: StudentAssignment) {
    const confirmed = await this.confirmAction(
      'Retirer de la classe ?',
      `Voulez-vous retirer l'élève ${a.studentFirstName} ${a.studentLastName} de cette classe ? Il retournera en file d'attente.`,
      'Oui, retirer',
      'danger'
    );

    if (confirmed && this.classId()) {
      this.isActionLoading.set(true);
      try {
        await firstValueFrom(this.academicService.unassignStudent(a.id));
        this.notificationService.success('Élève retiré de la classe.');
        this.loadData(this.classId()!);
      } catch (e) {
        this.notificationService.error("Impossible de retirer l'élève.");
      } finally {
        this.isActionLoading.set(false);
      }
    }
  }

  async handleTeamAction(event: { actionId: string, row: TableRow }) {
    const teaching = event.row.rawData as Teaching;
    if (event.actionId === 'assign') {
      this.openTeacherAssignment(teaching);
    } else if (event.actionId === 'remove') {
      this.confirmRemoveTeaching(teaching);
    }
  }

  private openTeacherAssignment(teaching: Teaching) {
    const dialogRef = this.dialog.open(TeacherSelectModalComponent, {
      width: '480px',
      panelClass: 'feewi-dialog-panel',
      data: {
        title: `Assigner à : ${teaching.subjectName}`,
        teachers: this.staffList(),
        currentTeacherId: teaching.teacherId
      }
    });

    dialogRef.afterClosed().subscribe(async (teacherId) => {
      if (teacherId && this.classId()) {
        this.isActionLoading.set(true);
        try {
          await firstValueFrom(this.academicService.assignTeacher(this.classId()!, teaching.id, teacherId));
          this.notificationService.success('Enseignant assigné avec succès.');
          this.loadData(this.classId()!);
        } catch (e) {
          this.notificationService.error("Échec de l'assignation.");
        } finally {
          this.isActionLoading.set(false);
        }
      }
    });
  }

  private async confirmRemoveTeaching(t: Teaching) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Retirer cet enseignement ?',
        message: `Voulez-vous retirer "${t.subjectName}" de cette classe ? Cette action supprimera également l'assignation du professeur.`,
        confirmLabel: 'Oui, retirer',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (confirmed && this.classId()) {
        this.isActionLoading.set(true);
        try {
          await firstValueFrom(this.academicService.removeTeachingFromClass(this.classId()!, t.id));
          this.notificationService.success('Enseignement retiré.');
          this.loadData(this.classId()!);
        } catch (error) {
          this.notificationService.error("Impossible de retirer ce cours.");
        } finally {
          this.isActionLoading.set(false);
        }
      }
    });
  }

  private confirmAction(title: string, message: string, confirmLabel: string, type: 'info' | 'warning' | 'danger'): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {title, message, confirmLabel, type}
    });
    return new Promise(resolve => dialogRef.afterClosed().subscribe(res => resolve(!!res)));
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
  }
}
