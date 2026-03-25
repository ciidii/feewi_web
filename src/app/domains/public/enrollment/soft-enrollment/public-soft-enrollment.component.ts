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
import { firstValueFrom } from 'rxjs';

import { EnrollmentPublicService } from '../../../../core/services/enrollment-public.service';
import { AcademicService } from '../../../../core/services/academic.service';
import { AcademicYear } from '../../../../core/models/academic.model';
import { AdmissionApplication } from '../../../../core/models/enrollment.model';

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
  application = signal<AdmissionApplication | null>(null);

  async ngOnInit() {
    try {
      const year = await this.academicService.getCurrentYear();
      this.activeYear.set(year);
    } catch (e) {
      console.warn('Erreur chargement année académique');
    }
  }

  /**
   * ÉTAPE 1 : Rechercher l'élève dans la base
   */
  async findStudent() {
    this.isLoading.set(true);
    try {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 800));

      // On simule une réponse positive pour la démo
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
    } catch (e) {
      alert('Élève introuvable avec ces informations.');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * ÉTAPE 2 : Confirmer la réinscription (Appel API métier)
   */
  async confirmReEnrollment() {
    const studentData = this.student();
    const yearId = this.activeYear()?.id;

    if (!studentData || !yearId) return;

    this.isLoading.set(true);
    try {
      const payload = {
        studentId: studentData.id,
        academicYearId: yearId,
        nextLevelId: 'level-uuid-mocked' // En prod, l'API le déduira ou on le passera
      };

      const res = await firstValueFrom(this.enrollmentService.reEnroll(payload));
      if (res) {
        this.application.set(res);
        this.currentStep.set('SUCCESS');
      }
    } catch (e) {
      console.error('Erreur lors de la réinscription:', e);
      alert('Impossible de valider la réinscription pour le moment.');
    } finally {
      this.isLoading.set(false);
    }
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
