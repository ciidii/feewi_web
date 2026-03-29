import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { LucideAngularModule, FileText, Type, Info } from 'lucide-angular';
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
  readonly Info = Info;

  docForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    mandatory: [false]
  });

  onSave() {
    if (this.docForm.valid) {
      const name = this.docForm.value.name;
      const generatedCode = this.generateCode(name);
      
      this.dialogRef.close({
        ...this.docForm.value,
        code: generatedCode
      });
    } else {
      this.docForm.markAllAsTouched();
    }
  }

  /**
   * Génère un code technique de 3 lettres à partir du nom
   * Ex: "Certificat" -> "CER", "Bulletin" -> "BUL"
   */
  private generateCode(name: string): string {
    return name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '') // Garde seulement Alphanumérique
      .substring(0, 3); // Prend les 3 premiers caractères
  }

  onCancel() {
    this.dialogRef.close();
  }

  isInvalid(controlName: string): boolean {
    const control = this.docForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
