import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {LucideAngularModule, Save, ShieldAlert, Stethoscope, User, X} from 'lucide-angular';
import {finalize} from 'rxjs';

import {StudentRegistryService} from '../../../../../core/services/student-registry.service';
import {StudentResponse, StudentStatus} from '../../../../../core/models/student.model';
import {FormShellComponent} from '../../../../../shared/components/form-shell/form-shell';
import {NotificationService} from '../../../../../shared/services/notification.service';

@Component({
  selector: 'app-student-edit-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LucideAngularModule,
    FormShellComponent
  ],
  templateUrl: './student-edit-form.component.html'
})
export class StudentEditFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private studentService = inject(StudentRegistryService);
  private notificationService = inject(NotificationService);

  // --- ICONS ---
  readonly User = User;
  readonly Stethoscope = Stethoscope;
  readonly ShieldAlert = ShieldAlert;
  readonly Save = Save;
  readonly X = X;

  // --- ÉTATS ---
  studentId: string | null = null;
  student = signal<StudentResponse | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);

  form: FormGroup = this.fb.group({
    status: ['', Validators.required],
    bloodGroup: [''],
    criticalAllergies: [''],
    nationality: [''],
    birthPlace: ['']
  });

  // 'ARCHIVED' volontairement absent : l'archivage doit passer par le bouton dédié de la
  // fiche élève (canBeArchived(), LEFT -> ARCHIVED uniquement). Avant BL-STUD-01 (backend),
  // le sélectionner ici contournait silencieusement ce garde-fou ; depuis, l'appel échoue
  // (500 sans message exploitable, cf. feewi_web/docs/STUDENT-FRONTEND-BACKLOG.md BL-FE-STUD-01/03).
  statusOptions = [
    { value: 'ACTIVE', label: 'Actif', class: 'text-emerald-600' },
    { value: 'SUSPENDED', label: 'Suspendu', class: 'text-amber-600' },
    { value: 'LEFT', label: 'Sorti de l\'établissement', class: 'text-rose-600' }
  ];

  readonly isArchived = signal(false);

  bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  ngOnInit() {
    this.studentId = this.route.snapshot.paramMap.get('id');
    if (this.studentId) {
      this.loadStudent(this.studentId);
    }
  }

  loadStudent(id: string) {
    this.isLoading.set(true);
    this.studentService.getStudentById(id).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (s) => {
        this.student.set(s);
        this.form.patchValue({
          status: s.status,
          bloodGroup: s.bloodGroup,
          criticalAllergies: s.criticalAllergies,
          // Fallback sur l'ancien emplacement (customFields) pour les dossiers déjà écrits
          // avant BL-FE-STUD-02 — birthPlace/nationality sont désormais de vrais champs.
          nationality: s.nationality || s.customFields?.['nationality'] || '',
          birthPlace: s.birthPlace || s.customFields?.['birth_place'] || ''
        });

        this.isArchived.set(s.status === 'ARCHIVED');
        if (s.status === 'ARCHIVED') {
          this.form.disable();
          this.notificationService.info(
            'Ce dossier est archivé et ne peut plus être modifié. Utilisez la fiche élève pour le consulter.'
          );
        }
      },
      error: () => this.notificationService.error('Impossible de charger les données de l\'élève.')
    });
  }

  onSubmit() {
    if (this.form.invalid || !this.studentId) return;

    this.isSaving.set(true);
    const val = this.form.value;

    const request = {
      status: val.status as StudentStatus,
      bloodGroup: val.bloodGroup,
      criticalAllergies: val.criticalAllergies,
      nationality: val.nationality,
      birthPlace: val.birthPlace
    };

    this.studentService.updateStudent(this.studentId, request).pipe(
      finalize(() => this.isSaving.set(false))
    ).subscribe({
      next: () => {
        this.notificationService.success('Modifications enregistrées avec succès.');
        this.router.navigate(['/admin/registry/students', this.studentId]);
      }
    });
  }

  cancel() {
    this.router.navigate(['/admin/registry/students', this.studentId]);
  }
}
