import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { LucideAngularModule, MessageSquare, Type, Info, Plus, Trash2, List } from 'lucide-angular';
import { FormShellComponent } from '../../../../../../../shared/components/form-shell/form-shell';
import { CustomFieldConfig } from '../../../../../../../core/models/enrollment.model';

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
  readonly Plus = Plus;
  readonly Trash2 = Trash2;
  readonly List = List;

  fieldForm: FormGroup = this.fb.group({
    label: ['', [Validators.required, Validators.minLength(3)]],
    type: ['text', Validators.required],
    required: [false],
    placeholder: [''],
    options: this.fb.array([])
  });

  get options() {
    return this.fieldForm.get('options') as FormArray;
  }

  addOption() {
    this.options.push(this.fb.control('', Validators.required));
  }

  removeOption(index: number) {
    this.options.removeAt(index);
  }

  onTypeChange() {
    const type = this.fieldForm.get('type')?.value;
    if (type !== 'select') {
      while (this.options.length) {
        this.options.removeAt(0);
      }
    } else if (this.options.length === 0) {
      this.addOption();
    }
  }

  onSave() {
    if (this.fieldForm.valid) {
      const formValue = this.fieldForm.value;
      const generatedName = this.generateFieldName(formValue.label);

      const result: CustomFieldConfig = {
        name: generatedName,
        label: formValue.label,
        type: formValue.type,
        required: formValue.required,
        placeholder: formValue.placeholder || undefined,
        options: formValue.type === 'select' ? formValue.options : undefined
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
}
