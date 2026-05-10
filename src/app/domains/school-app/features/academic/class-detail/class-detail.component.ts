import {Component, computed, inject, OnInit, signal, ViewEncapsulation} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, RouterModule} from '@angular/router';
import {firstValueFrom} from 'rxjs';
import {
  BookOpen,
  Calendar,
  GraduationCap,
  History,
  LucideAngularModule,
  Plus,
  RefreshCw,
  School,
  UserCheck,
  UserPlus,
  Users
} from 'lucide-angular';
import {FwPageShellComponent} from '../../../../../shared/components/page-shell/page-shell.component';
import {FwButtonComponent} from '../../../../../shared/components/button/button.component';
import {DataListComponent} from '../../../../../shared/components/data-list/data-list.component';
import {BlockLoaderComponent} from '../../../../../shared/components/loader/block-loader.component';
import {PageProgressComponent} from '../../../../../shared/components/loader/page-progress.component';
import {AcademicService} from '../../../../../core/services/academic.service';
import {StudentRegistryService} from '../../../../../core/services/student-registry.service';
import {IdentityService} from '../../../../../core/services/identity.service';
import {NotificationService} from '../../../../../shared/services/notification.service';
import {SchoolClass, Teaching} from '../../../../../core/models/academic.model';
import {StudentSummary} from '../../../../../core/models/student.model';
import {FwTab} from '../../../../../shared/components/tabs/tabs.component';
import {TableRow} from '../../../../../shared/models/data-list.models';
import {FwEmptyStateComponent} from '../../../../../shared/components/empty-state/empty-state.component';

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
    PageProgressComponent,
    FwEmptyStateComponent
  ],
  templateUrl: './class-detail.component.html',
  styleUrls: ['./class-detail.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ClassDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private academicService = inject(AcademicService);
  private studentService = inject(StudentRegistryService);
  private identityService = inject(IdentityService);
  private notificationService = inject(NotificationService);

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

  // États
  classId = signal<string | null>(null);
  schoolClass = signal<SchoolClass | null>(null);
  students = signal<StudentSummary[]>([]);
  teachings = signal<Teaching[]>([]);
  isLoading = signal(true);
  isActionLoading = signal(false);
  activeTab = signal('students');

  // Configuration des Onglets
  readonly classTabs: FwTab[] = [
    {id: 'students', label: 'Registre des Élèves', icon: Users},
    {id: 'team', label: 'Équipe Pédagogique', icon: UserCheck},
    {id: 'schedule', label: 'Emploi du temps', icon: Calendar}
  ];

  // Calculs réactifs
  richDescription = computed(() => {
    const c = this.schoolClass();
    if (!c) return 'Chargement...';
    return `${c.levelName || 'Niveau'} • ${this.students().length}/${c.capacity} Élèves • ${this.teachings().length} Matières`;
  });

  // Transformation des élèves pour DataList
  displayStudents = computed<TableRow[]>(() => {
    return this.students().map(s => ({
      id: s.id,
      title: `${s.firstName} ${s.lastName}`,
      subtitle: `Matricule: ${s.registrationNumber}`,
      avatarLabel: s.firstName[0] + s.lastName[0],
      badges: [{label: s.gender, type: 'info'}, {label: s.status, type: s.status === 'ACTIVE' ? 'success' : 'warning'}],
      rawData: s
    }));
  });

  // Transformation de l'équipe pour DataList
  displayTeam = computed<TableRow[]>(() => {
    return this.teachings().map(t => ({
      id: t.id,
      title: t.subjectName || 'Matière',
      subtitle: t.teacherName ? `Professeur: ${t.teacherName}` : 'Aucun professeur assigné',
      avatarLabel: (t.subjectName || '??').substring(0, 2).toUpperCase(),
      badges: [
        {label: `COEFF ${t.coefficient}`, type: 'info'},
        {label: t.teacherId ? 'ASSIGNÉ' : 'À POURVOIR', type: t.teacherId ? 'success' : 'danger'}
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
      const [cls, studentsPage, teachings] = await Promise.all([
        firstValueFrom(this.academicService.getClassById(id)),
        firstValueFrom(this.studentService.getStudents('', undefined, id, 0, 100)),
        firstValueFrom(this.academicService.getTeachingsByClass(id))
      ]);

      this.schoolClass.set(cls);
      this.students.set(studentsPage.content);
      this.teachings.set(teachings);
    } catch (error) {
      this.notificationService.error("Impossible de charger les détails de la classe.");
    } finally {
      this.isLoading.set(false);
    }
  }

  setTab(tab: string) {
    this.activeTab.set(tab);
  }

  handleStudentAction(event: any) {
    // Naviguer vers le dossier élève
    this.notificationService.info("Consultation élève bientôt disponible.");
  }

  handleTeamAction(event: any) {
    // Ouvrir le manager d'assignation
    this.notificationService.info("Assignation prof bientôt disponible.");
  }

  protected readonly RefreshCw = RefreshCw;
}
