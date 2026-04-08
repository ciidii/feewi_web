import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { LucideAngularModule, MessageSquare, Type, Info, Plus, Trash2, List } from 'lucide-angular';
import { FormShellComponent } from '../../../../../../../shared/components/form-shell/form-shell';
import { FieldConfig } from '../../../../../../../core/models/enrollment.model';

@Component({
  selector: 'app-custom-field-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    LucideAngularModule,
    FormShellComponent
  ],
  templateUrl: './custom-field-form.component.html',
  styleUrls: ['./custom-field-form.component.scss']
})
export class CustomFieldFormComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CustomFieldFormComponent>);

  readonly MessageSquare = MessageSquare;
  readonly Type = Type;
  readonly Info = Info;

  fieldForm: FormGroup = this.fb.group({
    label: ['', [Validators.required, Validators.minLength(3)]],
    type: ['TEXT', Validators.required],
    mandatory: [false], // Renommé mandatory pour V4
    placeholder: ['']
  });

  onSave() {
    if (this.fieldForm.valid) {
      const formValue = this.fieldForm.value;
      const generatedName = this.generateFieldName(formValue.label);

      const result: FieldConfig = {
        name: generatedName,
        label: formValue.label,
        type: formValue.type,
        mandatory: formValue.mandatory, // Alignement strict V4
        placeholder: formValue.placeholder || undefined
      };

      this.dialogRef.close(result);
    } else {
      this.fieldForm.markAllAsTouched();
    }
  }

  private generateFieldName(label: string): string {
    return 'custom_' + label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .substring(0, 20);
  }

  onCancel() {
    this.dialogRef.close();
  }

  isInvalid(controlName: string): boolean {
    const control = this.fieldForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  protected readonly Trash2 = Trash2;
  protected readonly Plus = Plus;
}
