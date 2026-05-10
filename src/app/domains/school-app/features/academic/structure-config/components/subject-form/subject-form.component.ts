import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {BookOpen, CheckCircle, Info, Layers, LucideAngularModule, Tag, Type} from 'lucide-angular';
import {firstValueFrom} from 'rxjs';
import {AcademicService} from '../../../../../../../core/services/academic.service';
import {NotificationService} from '../../../../../../../shared/services/notification.service';
import {FormShellComponent} from '../../../../../../../shared/components/form-shell/form-shell';

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
        await firstValueFrom(this.academicService.updateSubject(this.dialogData.subject.id, this.subjectForm.value));
        this.notificationService.success('La matière a été mise à jour.');
      } else {
        await firstValueFrom(this.academicService.createSubject(this.subjectForm.value));
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

  protected readonly Layers = Layers;
  protected readonly CheckCircle = CheckCircle;
}
