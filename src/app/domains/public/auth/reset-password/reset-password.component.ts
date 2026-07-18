import {Component, computed, inject, signal, ViewEncapsulation} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {ArrowLeft, Eye, EyeOff, KeyRound, Lock, LucideAngularModule, Send, ShieldCheck} from 'lucide-angular';
import {finalize, interval, take} from 'rxjs';
import {AuthService} from '../../../../core/services/auth.service';
import {NotificationService} from '../../../../shared/services/notification.service';
import {FwButtonComponent} from '../../../../shared/components/button/button.component';
import {TranslateModule, TranslateService} from '@ngx-translate/core';

const RESEND_COOLDOWN_SECONDS = 30;

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('newPassword')?.value;
  const confirm = control.get('confirmPassword')?.value;
  if (!password || !confirm) return null;
  return password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LucideAngularModule,
    FwButtonComponent,
    TranslateModule
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  public translate = inject(TranslateService);

  readonly ArrowLeft = ArrowLeft;
  readonly KeyRound = KeyRound;
  readonly ShieldCheck = ShieldCheck;
  readonly Lock = Lock;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly Send = Send;

  isLoading = signal(false);
  showPassword = signal(false);
  isSendingCode = signal(false);
  cooldownSeconds = signal(0);

  // D├®tecte si le code OTP est rempli (6 chiffres)
  isOtpComplete = computed(() => {
    const code = this.resetForm.get('code')?.value;
    return code && /^\d{6}$/.test(code);
  });

  resetForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]]
  });

  constructor() {
    const emailFromQuery = this.route.snapshot.queryParamMap.get('email');
    if (emailFromQuery) {
      this.resetForm.patchValue({ email: emailFromQuery });
    }
  }

  changeLanguage(lang: string) {
    this.translate.use(lang);
    localStorage.setItem('feewi_lang', lang);
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  sendCode() {
    const emailControl = this.resetForm.get('email');
    if (emailControl?.invalid) {
      emailControl.markAsTouched();
      return;
    }

    const email = emailControl!.value!;
    this.isSendingCode.set(true);

    this.authService.forgotPassword(email).pipe(
      finalize(() => this.isSendingCode.set(false))
    ).subscribe({
      next: () => {
        this.notificationService.success(
          this.translate.instant('auth.reset_password.notifications.code_sent_message'),
          this.translate.instant('auth.reset_password.notifications.code_sent_title')
        );
        this.startCooldown();
      },
      error: (err: any) => {
        const message = err?.error?.message || err?.message || this.translate.instant('auth.reset_password.notifications.error_title');
        this.notificationService.error(message, this.translate.instant('auth.reset_password.notifications.error_title'));
      }
    });
  }

  private startCooldown() {
    this.cooldownSeconds.set(RESEND_COOLDOWN_SECONDS);
    interval(1000).pipe(take(RESEND_COOLDOWN_SECONDS)).subscribe({
      next: () => this.cooldownSeconds.update(s => s - 1)
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.resetForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(controlName: string): string {
    const control = this.resetForm.get(controlName);
    if (control?.hasError('required')) {
      return controlName === 'code' ? 'auth.reset_password.fields.errors.otp_required' : 'auth.forgot_password.fields.email.errors.required';
    }
    if (control?.hasError('email')) return 'auth.forgot_password.fields.email.errors.email';
    if (control?.hasError('pattern')) return 'auth.reset_password.fields.errors.otp_required';
    if (control?.hasError('minlength')) return 'auth.reset_password.fields.errors.password_too_short';
    return 'Champ invalide';
  }

  get hasPasswordMismatch(): boolean {
    const form = this.resetForm;
    return !!(form.hasError('passwordMismatch') && (form.get('confirmPassword')?.touched || form.touched));
  }

  onSubmit() {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const { email, code, newPassword } = this.resetForm.value;
    this.isLoading.set(true);

    this.authService.resetPassword({
      email: email!,
      code: code!,
      newPassword: newPassword!
    }).subscribe({
      next: () => {
        this.notificationService.success(
          this.translate.instant('auth.reset_password.notifications.success_message'),
          this.translate.instant('auth.reset_password.notifications.success_title')
        );
        this.router.navigate(['/auth/login']);
      },
      error: (err: any) => {
        const message = err?.error?.message || err?.message || this.translate.instant('auth.reset_password.notifications.error_title');
        this.notificationService.error(message, this.translate.instant('auth.reset_password.notifications.error_title'));
        this.isLoading.set(false);
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }
}
