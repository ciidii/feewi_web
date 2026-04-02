import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { 
  LucideAngularModule, UserPlus, Save, X, RefreshCw, 
  User, ShieldCheck, GraduationCap, MapPin, Phone, Mail, BookOpen
} from 'lucide-angular';
import { EnrollmentAdminService } from '../../../../../core/services/enrollment-admin.service';
import { AcademicService } from '../../../../../core/services/academic.service';
import { TenantContextService } from '../../../../../core/services/tenant-context.service';
import { NotificationService } from '../../../../../shared/services/notification.service';
import { Level, Filiere, AcademicYear } from '../../../../../core/models/academic.model';
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
      // Vœu Scolaire
      academicYearId: ['', Validators.required],
      levelId: ['', Validators.required],
      filiereId: [null],

      // Responsable Légal
      primaryGuardian: this.fb.group({
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.email]],
        phone: ['', Validators.required],
        relation: ['FATHER', Validators.required],
        profession: [''],
        address: ['', Validators.required]
      }),

      // Identité du Candidat
      candidate: this.fb.group({
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        gender: ['', Validators.required],
        birthDate: ['', Validators.required],
        birthPlace: ['', Validators.required],
        nationality: ['Sénégalaise', Validators.required],
        previousSchool: ['']
      })
    });
  }

  /**
   * Chargement des référentiels nécessaires au formulaire
   */
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
        
        if (year) {
          this.entryForm.patchValue({ academicYearId: year.id });
        }
      },
      error: () => this.notificationService.error('Erreur lors du chargement des référentiels.')
    });
  }

  onSave() {
    if (this.entryForm.invalid) {
      this.entryForm.markAllAsTouched();
      this.notificationService.warning('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    this.isSaving.set(true);
    
    // CONSTRUCTION DU PAYLOAD (Alignement strict DTO Java)
    const rawValue = this.entryForm.value;
    const currentTenantId = this.tenantContext.activeTenant()?.id || 'default';

    const payload = {
      tenantId: currentTenantId,
      type: 'NEW', // Doit matcher l'enum ApplicationType.NEW du Java
      academicYearId: rawValue.academicYearId,
      levelId: rawValue.levelId,
      filiereId: rawValue.filiereId || null, // Forcer null si vide
      candidate: rawValue.candidate,
      primaryGuardian: {
        ...rawValue.primaryGuardian,
        email: rawValue.primaryGuardian.email || null // Nettoyage chaîne vide
      }
    };

    console.log('[DirectEntry] Payload envoyé au Backend Java:', payload);

    this.enrollmentService.createDirectApplication(payload).pipe(
      finalize(() => this.isSaving.set(false))
    ).subscribe({
      next: (res) => {
        this.notificationService.success(`Dossier créé avec succès (Réf: ${res.reference})`);
        this.router.navigate(['/admin/admissions', res.id]);
      },
      error: (err) => {
        console.error('[DirectEntry] Erreur lors de la création directe:', err);
        // L'erreur 409 sera notifiée par le service EnrollmentAdminService
      }
    });
  }

  // Icônes
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
}
