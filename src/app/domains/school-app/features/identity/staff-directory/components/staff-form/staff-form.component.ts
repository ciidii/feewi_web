import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatSelectModule} from '@angular/material/select';
import {MatButtonModule} from '@angular/material/button';
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle,
  Fingerprint,
  GraduationCap,
  Info,
  Key,
  Loader2,
  Lock,
  LucideAngularModule,
  Mail,
  Phone,
  Save,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
  UserCog,
  UserPlus,
  X
} from 'lucide-angular';
import {IdentityService} from '../../../../../../../core/services/identity.service';
import {NotificationService} from '../../../../../../../shared/services/notification.service';
import {FormShellComponent} from '../../../../../../../shared/components/form-shell/form-shell';
import {Staff, UserType} from '../../../../../../../core/models/user.model';
import {firstValueFrom} from 'rxjs';

@Component({
  selector: 'app-staff-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatSelectModule,
    MatButtonModule,
    LucideAngularModule,
    FormShellComponent
  ],
  templateUrl: './staff-form.component.html',
  styleUrls: ['./staff-form.component.scss']
})
export class StaffFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<StaffFormComponent>);
  private identityService = inject(IdentityService);
  private notificationService = inject(NotificationService);
  public data = inject(MAT_DIALOG_DATA, { optional: true });

  // Icônes
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
  readonly UserCog = UserCog;
  readonly Fingerprint = Fingerprint;
  readonly Key = Key;
  readonly Lock = Lock;

  staffForm: FormGroup = this.fb.group({
    // Section RH (Staff)
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.pattern(/^[+]?[0-9\s-]{8,}$/)]],
    staffType: ['TEACHER', [Validators.required]],
    matricule: [''],
    
    // Section Compte (User)
    enableAccount: [false],
    roles: [[]],
    password: ['password123']
  });

  roles = this.identityService.roles;
  isLoading = this.identityService.loading;
  
  isEditMode = false;
  isReadOnly = false;
  isForceAccountMode = false;

  staffTypes = [
    { code: 'TEACHER', label: 'Enseignant' },
    { code: 'ADMINISTRATION', label: 'Administration / Direction' },
    { code: 'SUPPORT', label: 'Personnel Support (Gardien, Chauffeur...)' },
    { code: 'OTHER', label: 'Autre' }
  ];

  async ngOnInit() {
    this.isEditMode = !!this.data?.staff;
    this.isReadOnly = !!this.data?.isReadOnly;
    this.isForceAccountMode = !!this.data?.forceAccountMode;

    if (this.roles().length === 0) {
      firstValueFrom(this.identityService.getRoles());
    }

    if (this.isEditMode) {
      const staff = this.data.staff as Staff;
      this.staffForm.patchValue({
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        phone: staff.phone,
        staffType: staff.staffType,
        matricule: staff.matricule,
        enableAccount: staff.hasUserAccount
      });

      if (this.isReadOnly) this.staffForm.disable();
      if (this.isForceAccountMode) {
        this.staffForm.get('enableAccount')?.setValue(true);
        // On ne bloque que la partie RH
        ['firstName', 'lastName', 'email', 'phone', 'staffType', 'matricule'].forEach(f => this.staffForm.get(f)?.disable());
      }
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
    if (control.hasError('minlength')) return `Minimum ${control.errors?.['minlength'].requiredLength} caractères`;
    if (control.hasError('pattern')) return 'Format de téléphone invalide';
    return '';
  }

  formatRoleName(roleName: string): string {
    return roleName.replace('ROLE_', '').replace(/_/g, ' ');
  }

  getSelectedRolesDisplay(): string {
    const selected = this.staffForm.get('roles')?.value || [];
    if (selected.length === 0) return 'Choisir des rôles';
    if (selected.length === 1) return this.formatRoleName(selected[0]);
    return `${selected.length} rôles sélectionnés`;
  }

  async onSave() {
    if (this.staffForm.invalid) {
      this.staffForm.markAllAsTouched();
      this.notificationService.warning('Vérifiez les champs avant de continuer.', 'Formulaire incomplet');
      return;
    }

    const formVal = this.staffForm.getRawValue();

    try {
      let staffId = this.data?.staff?.id;

      // 1. Gérer le Staff (RH)
      if (!this.isEditMode) {
        const staffReq = {
          firstName: formVal.firstName,
          lastName: formVal.lastName,
          email: formVal.email,
          phone: formVal.phone,
          staffType: formVal.staffType,
          matricule: formVal.matricule
        };
        const newStaff = await firstValueFrom(this.identityService.createStaff(staffReq));
        staffId = newStaff.id;
        this.notificationService.success('Profil RH créé.');
      } else if (!this.isForceAccountMode) {
        // Update staff logic here if needed
        this.notificationService.info('Mise à jour RH (prochainement)');
      }

      // 2. Gérer le compte utilisateur si demandé
      if (formVal.enableAccount && !this.data?.staff?.hasUserAccount) {
        if (!staffId) throw new Error("ID du personnel manquant pour créer un compte.");
        
        const userReq = {
          email: formVal.email,
          staffId: staffId,
          userTypeCode: formVal.staffType, 
          roles: formVal.roles,
          password: formVal.password
        };
        await firstValueFrom(this.identityService.createUserAccount(userReq));
        this.notificationService.success('Compte utilisateur activé.');
      }

      this.dialogRef.close(true);
    } catch (err: any) {
      const message = err?.error?.message || err?.message || 'Erreur lors de l\'opération.';
      this.notificationService.error(message);
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
