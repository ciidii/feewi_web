import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { LucideAngularModule, FileText, Type, Hash, Info } from 'lucide-angular';
import { FormShellComponent } from '../../../../../../../shared/components/form-shell/form-shell';

@Component({
  selector: 'app-document-type-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatDialogModule, 
    LucideAngularModule, 
    FormShellComponent
  ],
  templateUrl: './document-type-form.component.html',
  styleUrls: ['./document-type-form.component.scss']
})
export class DocumentTypeFormComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<DocumentTypeFormComponent>);

  readonly FileText = FileText;
  readonly Type = Type;
  readonly Hash = Hash;
  readonly Info = Info;

  docForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]{3}$/)]],
    mandatory: [false]
  });

  onSave() {
    if (this.docForm.valid) {
      this.dialogRef.close(this.docForm.value);
    } else {
      this.docForm.markAllAsTouched();
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  isInvalid(controlName: string): boolean {
    const control = this.docForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
