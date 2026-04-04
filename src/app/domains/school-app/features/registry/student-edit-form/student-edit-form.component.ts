import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LucideAngularModule, User, Stethoscope, ShieldAlert, Save, X } from 'lucide-angular';
import { finalize } from 'rxjs';

import { StudentRegistryService } from '../../../../../core/services/student-registry.service';
import { StudentResponse, StudentStatus } from '../../../../../core/models/student.model';
import { FormShellComponent } from '../../../../../shared/components/form-shell/form-shell';
import { NotificationService } from '../../../../../shared/services/notification.service';

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
    // On pourrait dynamiser les customFields selon une config, 
    // ici on simplifie en mappant les champs connus.
    nationality: [''],
    birthPlace: ['']
  });

  statusOptions = [
    { value: 'ACTIVE', label: 'Actif', class: 'text-emerald-600' },
    { value: 'SUSPENDED', label: 'Suspendu', class: 'text-amber-600' },
    { value: 'LEFT', label: 'Sorti de l\'établissement', class: 'text-rose-600' },
    { value: 'ARCHIVED', label: 'Archivé (Ancien élève)', class: 'text-slate-600' }
  ];

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
          nationality: s.customFields?.['nationality'] || '',
          birthPlace: s.customFields?.['birth_place'] || ''
        });
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
      customFields: {
        ...this.student()?.customFields,
        nationality: val.nationality,
        birth_place: val.birthPlace
      }
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
