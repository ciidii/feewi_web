import {Component, computed, inject, OnInit, signal, ViewEncapsulation} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, RouterLink, RouterModule} from '@angular/router';
import {
  Users,
  Search,
  ArrowRight,
  Filter,
  RefreshCw,
  School,
  CheckCircle,
  LayoutGrid,
  ChevronRight,
  UserCheck,
  ChevronLeft,
  X,
  History,
  GraduationCap,
  Calendar, Plus
} from 'lucide-angular';
import {firstValueFrom} from 'rxjs';
import {AcademicService} from '../../../../../core/services/academic.service';
import {NotificationService} from '../../../../../shared/services/notification.service';
import {AcademicYear, Level, SchoolClass, StudentAssignment} from '../../../../../core/models/academic.model';
import {FwPageShellComponent} from '../../../../../shared/components/page-shell/page-shell.component';
import {FwButtonComponent} from '../../../../../shared/components/button/button.component';
import {FwBadgeComponent} from '../../../../../shared/components/badge/badge.component';
import {FormsModule} from '@angular/forms';
import {SkeletonComponent} from '../../../../../shared/components/skeleton/skeleton.component';
import {LucideAngularModule} from 'lucide-angular';
import {CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-student-assignment',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    FwPageShellComponent,
    FwButtonComponent,
    FormsModule,
    SkeletonComponent,
    DragDropModule,
    RouterLink
  ],
  templateUrl: './student-assignment.component.html',
  styleUrls: ['./student-assignment.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class StudentAssignmentComponent implements OnInit {
  private academicService = inject(AcademicService);
  private notificationService = inject(NotificationService);
  private route = inject(ActivatedRoute);

  // États de chargement
  isLoading = signal(true);
  isAssigning = signal(false);

  // Données de référence
  years = signal<AcademicYear[]>([]);
  levels = signal<Level[]>([]);

  // États de sélection (Filtres)
  selectedYearId = signal<string>('');
  selectedLevelId = signal<string>('');
  searchQuery = signal('');

  // Données opérationnelles
  waitingList = signal<StudentAssignment[]>([]);
  targetClasses = signal<SchoolClass[]>([]);
  emptyArray: any[] = [];

  // Icônes
  readonly Users = Users;
  readonly Search = Search;
  readonly ArrowRight = ArrowRight;
  readonly Filter = Filter;
  readonly RefreshCw = RefreshCw;
  readonly School = School;
  readonly CheckCircle = CheckCircle;
  readonly LayoutGrid = LayoutGrid;
  readonly ChevronRight = ChevronRight;
  readonly UserCheck = UserCheck;
  readonly ChevronLeft = ChevronLeft;
  readonly X = X;
  readonly History = History;
  readonly GraduationCap = GraduationCap;
  readonly Calendar = Calendar;

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      const levelId = params.get('levelId');
      if (levelId) this.selectedLevelId.set(levelId);
    });
    this.loadFoundationData();
  }

  async loadFoundationData() {
    this.isLoading.set(true);
    try {
      const [allYears, allLevels] = await Promise.all([
        firstValueFrom(this.academicService.getYears()),
        firstValueFrom(this.academicService.getLevels())
      ]);

      this.years.set(allYears);
      this.levels.set(allLevels);

      // Sélectionner l'année active par défaut
      const active = allYears.find(y => y.status === 'ACTIVE') || allYears[0];
      if (active) this.selectedYearId.set(active.id);

      // Sélectionner le premier niveau par défaut
      if (allLevels.length > 0) {
        this.selectedLevelId.set(allLevels[0].id);
        this.loadOperationalData();
      }
    } catch (error) {
      this.notificationService.error("Impossible de charger les données de fondation.");
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadOperationalData() {
    const yearId = this.selectedYearId();
    const levelId = this.selectedLevelId();
    if (!yearId || !levelId) return;

    this.isLoading.set(true);
    try {
      const [waiting, classes] = await Promise.all([
        firstValueFrom(this.academicService.getWaitingAssignments(yearId, levelId)),
        firstValueFrom(this.academicService.getClassesByYear(yearId))
      ]);

      this.waitingList.set(waiting);
      // Filtrer les classes pour ne garder que celles du niveau sélectionné
      this.targetClasses.set(classes.filter(c => String(c.levelId) === String(levelId)));
    } catch (error) {
      this.notificationService.error("Erreur lors du chargement de la répartition.");
    } finally {
      this.isLoading.set(false);
    }
  }

  async onAssign(assignmentId: string, classId: string) {
    this.isAssigning.set(true);
    try {
      await firstValueFrom(this.academicService.assignStudent(assignmentId, classId));
      this.notificationService.success("Élève affecté avec succès.");
      this.loadOperationalData(); // Rafraîchir pour voir les nouvelles jauges
    } catch (error: any) {
      if (error.status === 409) {
        this.notificationService.error("La classe est déjà complète.");
      } else {
        this.notificationService.error("Échec de l'affectation.");
      }
    } finally {
      this.isAssigning.set(false);
    }
  }

  // --- DRAG & DROP LOGIC ---

  onDrop(event: CdkDragDrop<any[]>, targetClassId?: string) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const assignment = event.item.data as StudentAssignment;
      if (targetClassId) {
        this.onAssign(assignment.id, targetClassId);
      }
    }
  }

  // --- CALCULS ---

  filteredWaitingList = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.waitingList();
    return this.waitingList().filter(a =>
      `${a.studentFirstName} ${a.studentLastName}`.toLowerCase().includes(query)
    );
  });

  getClassFillRate(cls: SchoolClass): number {
    return cls.currentStudentCount || 0;
  }

  getClassGaugeWidth(cls: SchoolClass): number {
    if (!cls.capacity) return 0;
    return Math.min(100, (this.getClassFillRate(cls) / cls.capacity) * 100);
  }

  protected readonly Plus = Plus;
}
