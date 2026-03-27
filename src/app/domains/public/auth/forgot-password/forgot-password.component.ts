import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule, Mail, Send, ArrowLeft, Loader2, Info, AlertCircle, KeyRound } from 'lucide-angular';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LucideAngularModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  readonly Mail = Mail;
  readonly Send = Send;
  readonly ArrowLeft = ArrowLeft;
  readonly Loader2 = Loader2;
  readonly Info = Info;
  readonly AlertCircle = AlertCircle;
  readonly KeyRound = KeyRound;

  isLoading = signal(false);

  forgotPasswordForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  isInvalid(controlName: string): boolean {
    const control = this.forgotPasswordForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(controlName: string): string {
    const control = this.forgotPasswordForm.get(controlName);
    if (control?.hasError('required')) return 'Ce champ est obligatoire';
    if (control?.hasError('email')) return 'Format email invalide';
    return 'Champ invalide';
  }

  onSubmit() {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      this.notificationService.warning('Verifiez le formulaire.', 'Formulaire incomplet');
      return;
    }

    const email = this.forgotPasswordForm.value.email!;
    this.isLoading.set(true);

    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.notificationService.success('Code OTP envoye par email.', 'Verification');
        this.router.navigate(['/auth/reset-password'], { queryParams: { email } });
      },
      error: (err: any) => {
        const message = err?.error?.message || err?.message || "Impossible d'envoyer le code OTP.";
        this.notificationService.error(message, 'Echec de la demande');
        this.isLoading.set(false);
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }
}
