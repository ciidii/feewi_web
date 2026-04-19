import { Component, inject, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule, Mail, ArrowLeft, Info, KeyRound } from 'lucide-angular';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { FwButtonComponent } from '../../../../shared/components/button/button.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterModule, 
    LucideAngularModule, 
    FwButtonComponent,
    TranslateModule
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  public translate = inject(TranslateService);

  readonly Mail = Mail;
  readonly ArrowLeft = ArrowLeft;
  readonly Info = Info;
  readonly KeyRound = KeyRound;

  isLoading = signal(false);

  forgotPasswordForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  changeLanguage(lang: string) {
    this.translate.use(lang);
    localStorage.setItem('feewi_lang', lang);
  }

  isInvalid(controlName: string): boolean {
    const control = this.forgotPasswordForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(controlName: string): string {
    const control = this.forgotPasswordForm.get(controlName);
    if (control?.hasError('required')) return 'auth.forgot_password.fields.email.errors.required';
    if (control?.hasError('email')) return 'auth.forgot_password.fields.email.errors.email';
    return 'Champ invalide';
  }

  onSubmit() {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    const email = this.forgotPasswordForm.value.email!;
    this.isLoading.set(true);

    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.notificationService.success(
          this.translate.instant('auth.forgot_password.notifications.success_message'), 
          this.translate.instant('auth.forgot_password.notifications.success_title')
        );
        this.router.navigate(['/auth/reset-password'], { queryParams: { email } });
      },
      error: (err: any) => {
        const message = err?.error?.message || err?.message || this.translate.instant('auth.forgot_password.notifications.error_title');
        this.notificationService.error(message, this.translate.instant('auth.forgot_password.notifications.error_title'));
        this.isLoading.set(false);
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }
}
