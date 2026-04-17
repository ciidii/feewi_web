import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  LucideAngularModule,
  User,
  Home,
  Phone,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Edit2,
  Check,
  Search,
  RefreshCw,
  GraduationCap,
  MapPin,
  Calendar,
  Info
} from 'lucide-angular';
import { delay, finalize, firstValueFrom, of } from 'rxjs';

import { EnrollmentPublicService } from '../../../../core/services/enrollment-public.service';
import { AcademicService } from '../../../../core/services/academic.service';
import { TenantContextService } from '../../../../core/services/tenant-context.service';
import { AcademicYear } from '../../../../core/models/academic.model';
import { Admission } from '../../../../core/models/enrollment.model';

export type SoftStep = 'SEARCH' | 'CONFIRM' | 'SUCCESS';

@Component({
  selector: 'app-soft-enrollment',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, RouterModule],
  templateUrl: './public-soft-enrollment.component.html',
  styleUrls: ['./public-soft-enrollment.component.scss']
})
export class SoftEnrollmentComponent implements OnInit {
  private enrollmentService = inject(EnrollmentPublicService);
  private academicService = inject(AcademicService);
  private tenantContext = inject(TenantContextService);
  private router = inject(Router);

  // --- ÉTATS ---
  currentStep = signal<SoftStep>('SEARCH');
  isLoading = signal(false);
  activeYear = signal<AcademicYear | null>(null);

  // --- FORMULAIRE RECHERCHE ---
  searchForm = {
    matricule: '',
    birthDate: ''
  };

  // --- DONNÉES ÉLÈVE (Mocké pour l'instant car l'API student n'est pas encore là) ---
  student = signal<any>(null);

  // Simulation d'une application de réinscription créée
  application = signal<Admission | null>(null);

  ngOnInit() {
    this.academicService.getCurrentYear().subscribe({
      next: (year) => this.activeYear.set(year),
      error: () => console.warn('Erreur chargement année académique')
    });
  }

  /**
   * ÉTAPE 1 : Rechercher l'élève dans la base
   */
  findStudent() {
    this.isLoading.set(true);
    // Simulation d'un délai réseau réactif
    of(null).pipe(
      delay(800),
      finalize(() => this.isLoading.set(false))
    ).subscribe(() => {
      this.student.set({
        id: 'STU-2024-089',
        firstName: 'Moussa',
        lastName: 'Faye',
        currentLevel: '6ème A',
        nextLevel: '5ème B',
        guardianName: 'Awa Faye',
        guardianPhone: '+221 77 123 45 67'
      });
      this.currentStep.set('CONFIRM');
    });
  }

  /**
   * ÉTAPE 2 : Confirmer la réinscription (Appel API métier)
   */
  confirmReEnrollment() {
    const studentData = this.student();
    const yearId = this.activeYear()?.id;

    if (!studentData || !yearId) return;

    this.isLoading.set(true);
    this.enrollmentService.reEnroll({
      tenantId: this.tenantContext.activeTenant()?.id ?? '',
      studentId: studentData.id,
      academicYearId: yearId,
      nextLevelId: 'level-uuid-mocked'
    }).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (res: Admission) => {
        this.application.set(res);
        this.currentStep.set('SUCCESS');
      },
      error: (e: any) => {
        console.error('Erreur lors de la réinscription:', e);
        alert('Impossible de valider la réinscription pour le moment.');
      }
    });
  }

  reset() {
    this.currentStep.set('SEARCH');
    this.student.set(null);
    this.searchForm.matricule = '';
    this.searchForm.birthDate = '';
  }

  // Icônes
  readonly User = User;
  readonly GraduationCap = GraduationCap;
  readonly MapPin = MapPin;
  readonly Phone = Phone;
  readonly Calendar = Calendar;
  readonly Sparkles = Sparkles;
  readonly CheckCircle = CheckCircle;
  readonly AlertTriangle = AlertTriangle;
  readonly ArrowRight = ArrowRight;
  readonly Search = Search;
  readonly RefreshCw = RefreshCw;
  protected readonly Info = Info;
}
