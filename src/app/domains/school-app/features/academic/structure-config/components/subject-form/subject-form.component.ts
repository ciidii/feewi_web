import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LucideAngularModule, BookOpen, Type, Hash, Info, Tag } from 'lucide-angular';
import { AcademicService } from '../../../../../../../core/services/academic.service';
import { NotificationService } from '../../../../../../../shared/services/notification.service';
import { FormShellComponent } from '../../../../../../../shared/components/form-shell/form-shell';
import { Subject } from '../../../../../../../core/models/academic.model';

@Component({
  selector: 'app-subject-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    LucideAngularModule,
    FormShellComponent
  ],
  templateUrl: './subject-form.component.html',
  styleUrls: ['./subject-form.component.scss']
})
export class SubjectFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<SubjectFormComponent>);
  private academicService = inject(AcademicService);
  private notificationService = inject(NotificationService);
  private dialogData = inject(MAT_DIALOG_DATA, { optional: true });

  // Icônes
  readonly BookOpen = BookOpen;
  readonly Type = Type;
  readonly Tag = Tag;
  readonly Info = Info;

  subjectForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    code: ['', [Validators.required, Validators.maxLength(10)]]
  });

  isLoading = signal(false);
  isEditMode = !!this.dialogData?.subject;

  ngOnInit() {
    if (this.isEditMode) {
      this.subjectForm.patchValue(this.dialogData.subject);
    }
  }

  async onSave() {
    if (this.subjectForm.invalid) {
      this.subjectForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    try {
      if (this.isEditMode) {
        await this.academicService.updateSubject(this.dialogData.subject.id, this.subjectForm.value);
        this.notificationService.success('La matière a été mise à jour.');
      } else {
        await this.academicService.createSubject(this.subjectForm.value);
        this.notificationService.success('La matière a été ajoutée à la bibliothèque.');
      }
      this.dialogRef.close(true);
    } catch (error) {
      this.notificationService.error("Erreur lors de l'enregistrement de la matière.");
    } finally {
      this.isLoading.set(false);
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  isInvalid(controlName: string): boolean {
    const control = this.subjectForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
