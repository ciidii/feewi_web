import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { LucideAngularModule, GraduationCap, Type, Hash, Layers, Info, AlertCircle } from 'lucide-angular';
import { AcademicService } from '../../../../../../../core/services/academic.service';
import { NotificationService } from '../../../../../../../shared/services/notification.service';
import { FormShellComponent } from '../../../../../../../shared/components/form-shell/form-shell';
import {Cycle, Level} from '../../../../../../../core/models/academic.model';

@Component({
  selector: 'app-level-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatSelectModule,
    LucideAngularModule,
    FormShellComponent
  ],
  templateUrl: './level-form.component.html',
  styleUrls: ['./level-form.component.scss']
})
export class LevelFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<LevelFormComponent>);
  private academicService = inject(AcademicService);
  private notificationService = inject(NotificationService);
  private dialogData = inject(MAT_DIALOG_DATA, { optional: true });

  // Icônes
  readonly GraduationCap = GraduationCap;
  readonly Type = Type;
  readonly Hash = Hash;
  readonly Layers = Layers;
  readonly Info = Info;
  readonly AlertCircle = AlertCircle;

  levelForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    rank: [1, [Validators.required, Validators.min(1)]],
    cycleId: ['', [Validators.required]]
  });

  cycles = signal<Cycle[]>([]);
  isLoading = signal(false);
  isEditMode = !!this.dialogData?.level;

  ngOnInit() {
    this.loadCycles();
    if (this.dialogData?.level) {
      const level = this.dialogData.level as Level;
      this.levelForm.patchValue({
        name: level.name,
        rank: level.rank,
        cycleId: level.cycleId || (level as any).cycle?.id
      });
    } else if (this.dialogData?.cycleId) {
      this.levelForm.patchValue({ cycleId: this.dialogData.cycleId });
    }
  }

  async loadCycles() {
    try {
      const data = await this.academicService.getCycles();
      this.cycles.set(data);
    } catch (error) {
      this.notificationService.error("Impossible de charger les cycles.");
    }
  }

  async onSave() {
    if (this.levelForm.invalid) {
      this.levelForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    try {
      if (this.isEditMode) {
        await this.academicService.updateLevel(this.dialogData.level.id, this.levelForm.value);
        this.notificationService.success('Le niveau a été mis à jour.');
      } else {
        await this.academicService.createLevel(this.levelForm.value);
        this.notificationService.success('Le niveau a été créé avec succès.');
      }
      this.dialogRef.close(true);
    } catch (error) {
      this.notificationService.error("Erreur lors de l'enregistrement du niveau.");
    } finally {
      this.isLoading.set(false);
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  // Helpers validation
  isInvalid(controlName: string): boolean {
    const control = this.levelForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
