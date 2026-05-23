import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {IdentityService} from '../../../../../core/services/identity.service';
import {AuthService} from '../../../../../core/services/auth.service';
import {NotificationService} from '../../../../../shared/services/notification.service';
import {LucideAngularModule, ShieldCheck, Key, Eye, EyeOff, AlertCircle} from 'lucide-angular';
import {FwButtonComponent} from '../../../../../shared/components/button/button.component';

@Component({
  selector: 'app-force-password-change',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, FwButtonComponent],
  templateUrl: './force-password-change.component.html',
  styleUrl: './force-password-change.component.scss'
})
export class ForcePasswordChangeComponent {
  private fb = inject(FormBuilder);
  private identityService = inject(IdentityService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  // Icônes
  readonly ShieldCheck = ShieldCheck;
  readonly Key = Key;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly AlertCircle = AlertCircle;

  showOld = signal(false);
  showNew = signal(false);
  isLoading = signal(false);

  passwordForm: FormGroup = this.fb.group({
    oldPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : {'mismatch': true};
  }

  async onSubmit() {
    if (this.passwordForm.invalid) return;

    this.isLoading.set(true);
    try {
      await this.identityService.changePassword({
        oldPassword: this.passwordForm.value.oldPassword,
        newPassword: this.passwordForm.value.newPassword
      }).toPromise();

      this.notificationService.success('Votre mot de passe a été mis à jour.');
      
      // On re-fetch le profil pour mettre à jour le flag forceChangePassword
      await this.authService.fetchProfile().toPromise();
      this.router.navigate(['/admin/home']);
    } catch (err) {
      // Erreur gérée par le service (handleError)
    } finally {
      this.isLoading.set(false);
    }
  }

  isInvalid(controlName: string): boolean {
    const control = this.passwordForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
