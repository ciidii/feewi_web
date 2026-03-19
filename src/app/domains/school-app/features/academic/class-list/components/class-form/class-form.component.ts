import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { LucideAngularModule, School, Type, Hash, Layers, Info, Tag } from 'lucide-angular';
import { AcademicService } from '../../../../../../../core/services/academic.service';
import { NotificationService } from '../../../../../../../shared/services/notification.service';
import { FormShellComponent } from '../../../../../../../shared/components/form-shell/form-shell';
import { AcademicYear, Level, Filiere } from '../../../../../../../core/models/academic.model';

@Component({
  selector: 'app-class-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatSelectModule,
    LucideAngularModule,
    FormShellComponent
  ],
  templateUrl: './class-form.component.html',
  styleUrls: ['./class-form.component.scss']
})
export class ClassFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ClassFormComponent>);
  private academicService = inject(AcademicService);
  private notificationService = inject(NotificationService);
  private dialogData = inject(MAT_DIALOG_DATA);

  // Icônes
  readonly School = School;
  readonly Type = Type;
  readonly Hash = Hash;
  readonly Layers = Layers;
  readonly Tag = Tag;
  readonly Info = Info;

  classForm: FormGroup = this.fb.group({
    academicYearId: ['', [Validators.required]],
    levelId: ['', [Validators.required]],
    filiereId: [null],
    name: ['', [Validators.required, Validators.maxLength(10)]],
    capacity: [35, [Validators.required, Validators.min(1), Validators.max(100)]]
  });

  levels = signal<Level[]>([]);
  filieres = signal<Filiere[]>([]);
  isLoading = signal(false);

  ngOnInit() {
    if (this.dialogData.year) {
      this.classForm.patchValue({ academicYearId: this.dialogData.year.id });
    }
    
    // Pré-remplissage du niveau si fourni
    if (this.dialogData.levelId) {
      this.classForm.patchValue({ levelId: this.dialogData.levelId });
    }

    this.levels.set(this.dialogData.levels || []);
    this.loadFilieres();
  }

  async loadFilieres() {
    try {
      const data = await this.academicService.getFilieres();
      this.filieres.set(data);
    } catch (error) {
      console.error('Failed to load filieres', error);
    }
  }

  async onSave() {
    if (this.classForm.invalid) {
      this.classForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    try {
      await this.academicService.createClass(this.classForm.value);
      this.notificationService.success('La classe a été ouverte avec succès.');
      this.dialogRef.close(true);
    } catch (error) {
      this.notificationService.error("Erreur lors de l'ouverture de la classe.");
    } finally {
      this.isLoading.set(false);
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  isInvalid(controlName: string): boolean {
    const control = this.classForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
