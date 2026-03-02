import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LucideAngularModule, Layers, Type, Hash, Info } from 'lucide-angular';
import { AcademicService } from '../../../../../../../core/services/academic.service';
import { NotificationService } from '../../../../../../../shared/services/notification.service';
import { FormShellComponent } from '../../../../../../../shared/components/form-shell/form-shell';
import { Cycle } from '../../../../../../../core/models/academic.model';

@Component({
  selector: 'app-cycle-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    LucideAngularModule,
    FormShellComponent
  ],
  templateUrl: './cycle-form.component.html',
  styleUrls: ['./cycle-form.component.scss']
})
export class CycleFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CycleFormComponent>);
  private academicService = inject(AcademicService);
  private notificationService = inject(NotificationService);
  private dialogData = inject(MAT_DIALOG_DATA, { optional: true });

  // Icônes
  readonly Layers = Layers;
  readonly Type = Type;
  readonly Hash = Hash;
  readonly Info = Info;

  cycleForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    rank: [1, [Validators.required, Validators.min(1)]]
  });

  isLoading = signal(false);
  isEditMode = !!this.dialogData?.cycle;

  ngOnInit() {
    if (this.dialogData?.cycle) {
      this.cycleForm.patchValue(this.dialogData.cycle);
    }
  }

  async onSave() {
    if (this.cycleForm.invalid) {
      this.cycleForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    try {
      if (this.isEditMode) {
        await this.academicService.updateCycle(this.dialogData.cycle.id, this.cycleForm.value);
        this.notificationService.success('Le cycle a été mis à jour.');
      } else {
        await this.academicService.createCycle(this.cycleForm.value);
        this.notificationService.success('Le cycle éducatif a été créé avec succès.');
      }
      this.dialogRef.close(true);
    } catch (error) {
      this.notificationService.error("Erreur lors de l'enregistrement du cycle.");
    } finally {
      this.isLoading.set(false);
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  isInvalid(controlName: string): boolean {
    const control = this.cycleForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
