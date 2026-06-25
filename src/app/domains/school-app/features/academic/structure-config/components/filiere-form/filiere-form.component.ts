import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {BookOpen, Info, LucideAngularModule, Tag, Type} from 'lucide-angular';
import {firstValueFrom} from 'rxjs';
import {AcademicService} from '../../../../../../../core/services/academic.service';
import {NotificationService} from '../../../../../../../shared/services/notification.service';
import {FormShellComponent} from '../../../../../../../shared/components/form-shell/form-shell';

@Component({
  selector: 'app-filiere-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    LucideAngularModule,
    FormShellComponent
  ],
  templateUrl: './filiere-form.component.html',
  styleUrls: ['./filiere-form.component.scss']
})
export class FiliereFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<FiliereFormComponent>);
  private academicService = inject(AcademicService);
  private notificationService = inject(NotificationService);
  private dialogData = inject(MAT_DIALOG_DATA, { optional: true });

  // Icônes
  readonly BookOpen = BookOpen;
  readonly Type = Type;
  readonly Tag = Tag;
  readonly Info = Info;

  filiereForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    code: ['', [Validators.required, Validators.maxLength(5)]]
  });

  isLoading = signal(false);
  isEditMode = !!this.dialogData?.filiere;

  ngOnInit() {
    if (this.isEditMode) {
      this.filiereForm.patchValue(this.dialogData.filiere);
    }
  }

  async onSave() {
    if (this.filiereForm.invalid) {
      this.filiereForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    try {
      if (this.isEditMode) {
        // Note: updateFiliere n'est pas encore dans le service mais sera ajouté si besoin
        this.notificationService.info("Mise à jour en cours d'implémentation.");
      } else {
        await firstValueFrom(this.academicService.createFiliere(this.filiereForm.value));
        this.notificationService.success('La série a été ajoutée au référentiel.');
      }
      this.dialogRef.close(true);
    } catch (error) {
      this.notificationService.error("Erreur lors de l'enregistrement de la série.");
    } finally {
      this.isLoading.set(false);
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  isInvalid(controlName: string): boolean {
    const control = this.filiereForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
