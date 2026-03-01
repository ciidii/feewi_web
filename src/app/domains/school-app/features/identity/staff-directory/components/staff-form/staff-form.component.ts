import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import {
  LucideAngularModule,
  User,
  Mail,
  Phone,
  Shield,
  Save,
  X,
  CheckCircle,
  Info,
  Loader2,
  AlertCircle,
  UserPlus,
  UserCog,
  GraduationCap,
  BookOpen,
  Calendar,
  ShieldCheck,
  Sparkles
} from 'lucide-angular';
import { IdentityService } from '../../../../../../../core/services/identity.service';
import { NotificationService } from '../../../../../../../shared/services/notification.service';

@Component({
  selector: 'app-staff-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatSelectModule,
    MatButtonModule,
    LucideAngularModule
  ],
  templateUrl: './staff-form.component.html',
  styleUrls: ['./staff-form.component.scss']
})
export class StaffFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<StaffFormComponent>);
  private identityService = inject(IdentityService);
  private notificationService = inject(NotificationService);

  readonly UserPlus = UserPlus;
  readonly User = User;
  readonly Mail = Mail;
  readonly Phone = Phone;
  readonly Shield = Shield;
  readonly Save = Save;
  readonly X = X;
  readonly CheckCircle = CheckCircle;
  readonly Info = Info;
  readonly Loader2 = Loader2;
  readonly AlertCircle = AlertCircle;
  readonly ShieldCheck = ShieldCheck;
  readonly Sparkles = Sparkles;

  staffForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.pattern(/^[+]?[0-9\s-]{8,}$/)]],
    roles: [[], [Validators.required, Validators.minLength(1)]],
    password: ['password123']
  });

  roles = this.identityService.roles;
  isLoading = this.identityService.loading;

  ngOnInit() {
    if (this.roles().length === 0) {
      this.identityService.getRoles();
    }
  }

  isValid(field: string): boolean {
    const control = this.staffForm.get(field);
    return control ? control.valid && (control.dirty || control.touched) : false;
  }

  isInvalid(field: string): boolean {
    const control = this.staffForm.get(field);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  getErrorMessage(field: string): string {
    const control = this.staffForm.get(field);
    if (!control) return '';

    if (control.hasError('required')) return 'Ce champ est requis';
    if (control.hasError('email')) return "Format d'email invalide";
    if (control.hasError('minlength')) return `Minimum ${control.errors?.['minlength'].requiredLength} caracteres`;
    if (control.hasError('pattern')) return 'Format de telephone invalide';
    return '';
  }

  formatRoleName(roleName: string): string {
    return roleName.replace('ROLE_', '').replace(/_/g, ' ');
  }

  getRoleIcon(roleName: string): any {
    if (roleName.includes('ADMIN')) return UserCog;
    if (roleName.includes('TEACHER')) return GraduationCap;
    if (roleName.includes('STUDENT')) return BookOpen;
    if (roleName.includes('PARENT')) return Calendar;
    return ShieldCheck;
  }

  getSelectedRolesDisplay(): string {
    const selected = this.staffForm.get('roles')?.value || [];
    if (selected.length === 0) return 'Choisir des roles';
    if (selected.length === 1) return this.formatRoleName(selected[0]);
    return `${selected.length} roles selectionnes`;
  }

  getSelectedRolesCount(): number {
    return this.staffForm.get('roles')?.value?.length || 0;
  }

  async onSave() {
    if (this.staffForm.invalid) {
      Object.keys(this.staffForm.controls).forEach((key) => {
        this.staffForm.get(key)?.markAsTouched();
      });
      this.notificationService.warning('Verifiez les champs avant de continuer.', 'Formulaire incomplet');
      return;
    }

    try {
      await this.identityService.createStaff(this.staffForm.value);
      this.notificationService.success('Personnel cree avec succes.', 'Creation terminee');
      this.dialogRef.close(true);
    } catch (err: any) {
      const message =
        err?.error?.message || err?.message || 'Une erreur est survenue lors de la creation du personnel.';
      this.notificationService.error(message, 'Echec de creation');
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
