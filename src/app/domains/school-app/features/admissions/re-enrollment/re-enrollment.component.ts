import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import {
  LucideAngularModule,
  Search,
  User,
  ArrowRight,
  Save,
  X,
  Phone,
  MapPin,
  Sparkles,
  CheckCircle,
  Info,
  RefreshCw
} from 'lucide-angular';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, firstValueFrom } from 'rxjs';
import { IdentityService } from '../../../../../core/services/identity.service';
import { EnrollmentPublicService } from '../../../../../core/services/enrollment-public.service';
import { NotificationService } from '../../../../../shared/services/notification.service';
import { AcademicService } from '../../../../../core/services/academic.service';
import { User as StudentUser } from '../../../../../core/models/user.model';

@Component({
  selector: 'app-secretary-re-enrollment',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, RouterModule],
  templateUrl: './re-enrollment.component.html',
  styleUrls: ['./re-enrollment.component.scss']
})
export class SecretaryReEnrollmentComponent implements OnInit, OnDestroy {
  private identityService = inject(IdentityService);
  private enrollmentService = inject(EnrollmentPublicService);
  private academicService = inject(AcademicService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  // État de la recherche
  searchQuery = signal('');
  isLoading = signal(false);
  isSaving = signal(false);
  selectedStudent = signal<any>(null);
  searchResults = signal<StudentUser[]>([]);

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.performSearch(query);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(query: string) {
    this.searchQuery.set(query);
    this.searchSubject.next(query);
  }

  async performSearch(query: string) {
    if (query.length < 2) {
      this.searchResults.set([]);
      return;
    }

    this.isLoading.set(true);
    try {
      // On utilise IdentityService pour chercher les utilisateurs de type STUDENT
      await this.identityService.getStaff(query, 0, 10, 'STUDENT');
      const page = this.identityService.staffPage();
      this.searchResults.set(page?.content || []);
    } catch (e) {
      this.notificationService.error('Erreur lors de la recherche des élèves.');
    } finally {
      this.isLoading.set(false);
    }
  }

  // Sélectionner un élève
  async selectStudent(student: StudentUser) {
    this.isLoading.set(true);
    try {
      const year = await this.academicService.getCurrentYear();
      
      this.selectedStudent.set({
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phone: student.phone || '',
        academicYearId: year.id,
        academicYearLabel: year.label,
        // Ces infos devraient idéalement venir d'un service de scolarité (StudentService)
        // On simule pour l'instant le passage au niveau suivant
        level: 'Niveau Actuel', 
        nextLevel: 'Niveau Suivant',
        nextLevelId: 'uuid-next-level' 
      });
      this.searchQuery.set('');
      this.searchResults.set([]);
    } catch (e) {
      this.notificationService.error('Erreur lors de la récupération des infos académiques.');
    } finally {
      this.isLoading.set(false);
    }
  }

  // Actions
  async onSave() {
    const student = this.selectedStudent();
    if (!student || !student.id) return;

    this.isSaving.set(true);
    try {
      const payload = {
        studentId: student.id,
        academicYearId: student.academicYearId,
        nextLevelId: student.nextLevelId
      };

      const res = await firstValueFrom(this.enrollmentService.reEnroll(payload));
      if (res) {
        this.notificationService.success(`Réinscription initiée pour ${student.name}.`);
        // Redirection vers le détail pour continuer le processus (documents, etc.)
        this.router.navigate(['/admissions', res.id]);
      }
    } catch (e) {
      this.notificationService.error('Erreur lors de l\'enregistrement de la réinscription.');
    } finally {
      this.isSaving.set(false);
    }
  }

  // Icônes
  readonly Search = Search;
  readonly User = User;
  readonly ArrowRight = ArrowRight;
  readonly Save = Save;
  readonly X = X;
  readonly Phone = Phone;
  readonly MapPin = MapPin;
  readonly Sparkles = Sparkles;
  readonly CheckCircle = CheckCircle;
  readonly RefreshCw = RefreshCw;
  protected readonly Info = Info;
}
