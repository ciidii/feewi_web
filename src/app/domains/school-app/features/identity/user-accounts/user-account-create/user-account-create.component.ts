import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterModule} from '@angular/router';
import {
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Eye,
  EyeOff,
  Fingerprint,
  Info,
  Key,
  LucideAngularModule,
  Mail,
  Shield,
  ShieldCheck,
  User as UserIcon,
  UserPlus,
  Zap,
  Lock
} from 'lucide-angular';
import {firstValueFrom} from 'rxjs';
import {MatSelectModule} from '@angular/material/select';
import {FwPageShellComponent} from '../../../../../../shared/components/page-shell/page-shell.component';
import {FwButtonComponent} from '../../../../../../shared/components/button/button.component';
import {IdentityService} from '../../../../../../core/services/identity.service';
import {NotificationService} from '../../../../../../shared/services/notification.service';
import {Staff} from '../../../../../../core/models/user.model';

@Component({
  selector: 'app-user-account-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LucideAngularModule,
    FwPageShellComponent,
    FwButtonComponent,
    MatSelectModule
  ],
  templateUrl: './user-account-create.component.html',
  styleUrls: ['./user-account-create.component.scss']
})
export class UserAccountCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private identityService = inject(IdentityService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  // Icônes
  readonly Shield = Shield;
  readonly ShieldCheck = ShieldCheck;
  readonly Mail = Mail;
  readonly UserIcon = UserIcon;
  readonly UserPlus = UserPlus;
  readonly AlertCircle = AlertCircle;
  readonly Fingerprint = Fingerprint;
  readonly Key = Key;
  readonly Info = Info;
  readonly Zap = Zap;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly Lock = Lock;

  // États
  isLoading = signal(false);
  showPassword = signal(false);
  availableStaff = signal<Staff[]>([]);
  selectedStaff = signal<Staff | null>(null);
  availableRoles = this.identityService.roles;

  accountForm: FormGroup = this.fb.group({
    staffId: [null, [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    roles: [[], [Validators.required, Validators.minLength(1)]],
    active: [true],
    userTypeCode: ['ADMIN']
  });

  ngOnInit() {
    this.loadStaffWithoutAccount();
    this.identityService.getRoles().subscribe();
  }

  async loadStaffWithoutAccount() {
    try {
      const res = await firstValueFrom(this.identityService.getStaff('', 0, 100));
      this.availableStaff.set(res.content.filter(s => !s.hasUserAccount));
    } catch (e) {
      console.error("Failed to load staff", e);
    }
  }

  onStaffSelect(staffId: string) {
    const staff = this.availableStaff().find(s => s.id === staffId);
    if (staff) {
      this.selectedStaff.set(staff);
      this.accountForm.patchValue({
        email: staff.email,
        userTypeCode: staff.staffType === 'TEACHER' ? 'TEACHER' : 'ADMIN'
      });
    }
  }

  async onSave() {
    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      return;
    }

    const staff = this.selectedStaff();
    if (!staff) return;

    this.isLoading.set(true);
    try {
      const formData = this.accountForm.getRawValue();
      const newUser = await firstValueFrom(this.identityService.createUserAccount({
        email: formData.email,
        password: formData.password,
        staffId: formData.staffId,
        firstName: staff.firstName,
        lastName: staff.lastName,
        userTypeCode: formData.userTypeCode,
        roles: formData.roles
      }));

      this.notificationService.success('Compte utilisateur créé avec succès.');
      this.router.navigate(['/admin/identity/accounts', newUser.id]);
    } catch (err) {
      console.error('Account Save Error', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  onCancel() {
    this.router.navigate(['/admin/identity/accounts']);
  }

  isInvalid(controlName: string): boolean {
    const control = this.accountForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
