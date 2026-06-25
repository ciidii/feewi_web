import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {firstValueFrom} from 'rxjs';
import {AlertCircle, FileText, Info, Loader2, LucideAngularModule, Save, Shield, Type, X} from 'lucide-angular';
import {IdentityService} from '../../../../../../../core/services/identity.service';
import {NotificationService} from '../../../../../../../shared/services/notification.service';
import {FormShellComponent} from '../../../../../../../shared/components/form-shell/form-shell';

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    LucideAngularModule,
    FormShellComponent
  ],
  templateUrl: './role-form.component.html',
  styleUrl: './role-form.component.scss'
})
export class RoleFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<RoleFormComponent>);
  private identityService = inject(IdentityService);
  private notificationService = inject(NotificationService);

  readonly Shield = Shield;
  readonly Save = Save;
  readonly X = X;
  readonly Info = Info;
  readonly AlertCircle = AlertCircle;
  readonly Loader2 = Loader2;
  readonly Type = Type;
  readonly FileText = FileText;

  roleForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.pattern('^ROLE_[A-Z_]+$')]],
    description: ['', [Validators.required, Validators.maxLength(100)]],
    permissions: [[]]
  });

  isLoading = this.identityService.loading;

  ngOnInit() {}

  onSave() {
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      this.notificationService.warning('Vérifiez les champs avant de continuer.', 'Formulaire incomplet');
      return;
    }

    const roleData = this.roleForm.value;
    this.identityService.createRole(roleData).subscribe({
      next: () => {
        this.notificationService.success('Rôle créé avec succès.', 'Création terminée');
        this.dialogRef.close(true);
      },
      error: (err: any) => {
        const message = err?.error?.message || err?.message || 'Échec lors de la création du rôle.';
        this.notificationService.error(message, 'Échec de création');
        console.error('Failed to create role', err);
      }
    });
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  isInvalid(controlName: string): boolean {
    const control = this.roleForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  isValid(controlName: string): boolean {
    const control = this.roleForm.get(controlName);
    return !!(control && control.valid && (control.dirty || control.touched));
  }

  getErrorMessage(controlName: string): string {
    const control = this.roleForm.get(controlName);
    if (control?.hasError('required')) return 'Ce champ est obligatoire';
    if (control?.hasError('minlength')) return `Minimum ${control.errors?.['minlength'].requiredLength} caractères`;
    if (control?.hasError('pattern')) return 'Le nom doit commencer par ROLE_ (ex: ROLE_SURVEILLANT)';
    return 'Champ invalide';
  }
}
