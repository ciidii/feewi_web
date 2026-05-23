import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatSelectModule} from '@angular/material/select';
import {firstValueFrom} from 'rxjs';
import {IdentityService} from '../../../../../../../core/services/identity.service';
import {NotificationService} from '../../../../../../../shared/services/notification.service';
import {Role} from '../../../../../../../core/models/role.model';
import {Staff, User} from '../../../../../../../core/models/user.model';
import {FormShellComponent} from '../../../../../../../shared/components/form-shell/form-shell';
import {LucideAngularModule, Shield, ShieldCheck, Mail, User as UserIcon, AlertCircle} from 'lucide-angular';

@Component({
  selector: 'app-account-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatDialogModule, 
    MatSelectModule, 
    FormShellComponent,
    LucideAngularModule
  ],
  templateUrl: './account-form.component.html',
  styleUrl: './account-form.component.scss'
})
export class AccountFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private identityService = inject(IdentityService);
  private notificationService = inject(NotificationService);
  private dialogRef = inject(MatDialogRef<AccountFormComponent>);
  data: { staff?: Staff, user?: User } = inject(MAT_DIALOG_DATA);

  // Icônes
  readonly Shield = Shield;
  readonly ShieldCheck = ShieldCheck;
  readonly Mail = Mail;
  readonly UserIcon = UserIcon;
  readonly AlertCircle = AlertCircle;

  accountForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    roles: [[], [Validators.required, Validators.minLength(1)]],
    active: [true],
    userTypeCode: ['ADMIN'] // Par défaut
  });

  availableRoles = this.identityService.roles;
  isLoading = signal(false);
  isEditMode = !!this.data.user;

  ngOnInit() {
    this.identityService.getRoles().subscribe();

    if (this.isEditMode && this.data.user) {
      this.accountForm.patchValue({
        email: this.data.user.email,
        roles: this.data.user.roles,
        active: this.data.user.active,
        userTypeCode: this.data.user.userType || 'ADMIN'
      });
      this.accountForm.get('email')?.disable(); // L'email (login) est immuable
    } else if (this.data.staff) {
      // Pré-remplissage depuis la fiche RH
      this.accountForm.patchValue({
        email: this.data.staff.email,
        userTypeCode: this.data.staff.staffType === 'TEACHER' ? 'TEACHER' : 'ADMIN'
      });
    }
  }

  async onSave() {
    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    try {
      const formData = this.accountForm.getRawValue();
      
      if (this.isEditMode) {
        // Mise à jour (Rôles et Status)
        // Note: L'API peut varier, ici on suit le guide
        await firstValueFrom(this.identityService.toggleUserActive(this.data.user!.id!, formData.active));
        await firstValueFrom(this.identityService.updateRole(this.data.user!.id!, { roles: formData.roles }));
      } else {
        // Création (lié au staff)
        await firstValueFrom(this.identityService.createUserAccount({
          email: formData.email,
          staffId: this.data.staff!.id,
          userTypeCode: formData.userTypeCode,
          roles: formData.roles
        }));
      }

      this.notificationService.success(this.isEditMode ? 'Accès mis à jour' : 'Accès créé avec succès');
      this.dialogRef.close(true);
    } catch (err) {
      console.error('Account Save Error', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
