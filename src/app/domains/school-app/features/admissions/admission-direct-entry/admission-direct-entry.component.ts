import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  LucideAngularModule, UserPlus, Save, X, RefreshCw,
  User, ShieldCheck, GraduationCap, MapPin, Phone, Mail, BookOpen, HeartPulse, Users, School
} from 'lucide-angular';
import { EnrollmentAdminService } from '../../../../../core/services/enrollment-admin.service';
import { AcademicService } from '../../../../../core/services/academic.service';
import { TenantContextService } from '../../../../../core/services/tenant-context.service';
import { NotificationService } from '../../../../../shared/services/notification.service';
import { Level, Filiere, AcademicYear } from '../../../../../core/models/academic.model';
import { DirectEntryRequest } from '../../../../../core/models/enrollment.model';
import { finalize, forkJoin } from 'rxjs';

@Component({
  selector: 'app-admission-direct-entry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, RouterModule],
  templateUrl: './admission-direct-entry.component.html',
  styleUrls: ['./admission-direct-entry.component.scss']
})
export class AdmissionDirectEntryComponent implements OnInit {
  private fb = inject(FormBuilder);
  private enrollmentService = inject(EnrollmentAdminService);
  private academicService = inject(AcademicService);
  private tenantContext = inject(TenantContextService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  // --- ÉTATS ---
  entryForm!: FormGroup;
  isLoading = signal(true);
  isSaving = signal(false);

  // --- RÉFÉRENTIELS ---
  levels = signal<Level[]>([]);
  filieres = signal<Filiere[]>([]);
  activeYear = signal<AcademicYear | null>(null);

  constructor() {
    this.initForm();
  }

  ngOnInit() {
    this.loadData();
  }

  private initForm() {
    this.entryForm = this.fb.group({
      // Pilier Scolarité (Vœu)
      academicYearId: ['', Validators.required],
      levelId: ['', Validators.required],
      filiereId: [null],
      previousSchool: [''],

      // Pilier Famille
      family: this.fb.group({
        primaryGuardian: this.fb.group({
          firstName: ['', [Validators.required, Validators.minLength(2)]],
          lastName: ['', [Validators.required, Validators.minLength(2)]],
          email: ['', [Validators.email]],
          phone: ['', Validators.required],
          relation: ['FATHER', Validators.required],
          isFinancialResponsible: [true]
        }),
        homeAddress: ['', Validators.required]
      }),

      // Pilier Identité (Enfant)
      identity: this.fb.group({
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        gender: ['', Validators.required],
        birthDate: ['', Validators.required],
        birthPlace: ['', Validators.required],
        nationality: ['Sénégalaise', Validators.required]
      }),

      // Pilier Médical (Optionnel au guichet)
      medical: this.fb.group({
        bloodGroup: [''],
        criticalAllergies: ['']
      })
    });
  }

  loadData() {
    this.isLoading.set(true);
    forkJoin({
      year: this.academicService.getCurrentYear(),
      levels: this.academicService.getLevels(),
      filieres: this.academicService.getFilieres()
    }).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: ({ year, levels, filieres }) => {
        this.activeYear.set(year);
        this.levels.set(levels);
        this.filieres.set(filieres);
        if (year) this.entryForm.patchValue({ academicYearId: year.id });
      }
    });
  }

  onSave() {
    if (this.entryForm.invalid) {
      this.entryForm.markAllAsTouched();
      this.notificationService.warning('Veuillez remplir les champs obligatoires.');
      return;
    }

    this.isSaving.set(true);
    const val = this.entryForm.value;
    const tenantId = this.tenantContext.activeTenant()?.id || 'default';

    const payload: DirectEntryRequest = {
      tenantId,
      type: 'NEW_ENROLLMENT',
      academicYearId: val.academicYearId,
      levelId: val.levelId,
      identity: {
        firstName: val.identity.firstName,
        lastName: val.identity.lastName,
        gender: val.identity.gender,
        birthDate: val.identity.birthDate,
        birthPlace: val.identity.birthPlace,
        customFields: {nationality: val.identity.nationality}
      },
      primaryGuardian: {
        firstName: val.family.primaryGuardian.firstName,
        lastName: val.family.primaryGuardian.lastName,
        phone: val.family.primaryGuardian.phone,
        relation: val.family.primaryGuardian.relation,
        financialResponsible: val.family.primaryGuardian.isFinancialResponsible ?? true,
        customFields: {homeAddress: val.family.homeAddress}
      }
    };

    this.enrollmentService.createDirectApplication(payload).pipe(
      finalize(() => this.isSaving.set(false))
    ).subscribe({
      next: (res) => {
        this.notificationService.success(`Dossier créé (Réf: ${res.reference})`);
        this.router.navigate(['/admin/admissions', res.id]);
      }
    });
  }

  readonly UserPlus = UserPlus;
  readonly Save = Save;
  readonly X = X;
  readonly RefreshCw = RefreshCw;
  readonly User = User;
  readonly ShieldCheck = ShieldCheck;
  readonly GraduationCap = GraduationCap;
  readonly MapPin = MapPin;
  readonly Phone = Phone;
  readonly Mail = Mail;
  readonly BookOpen = BookOpen;
  readonly HeartPulse = HeartPulse;
  protected readonly Users = Users;
  protected readonly School = School;
}
