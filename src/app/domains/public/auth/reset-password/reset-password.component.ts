import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  LucideAngularModule,
  ArrowLeft,
  KeyRound,
  Mail,
  ShieldCheck,
  Lock,
  RefreshCcw
} from 'lucide-angular';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { FwButtonComponent } from '../../../../shared/components/button/button.component';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('newPassword')?.value;
  const confirm = control.get('confirmPassword')?.value;
  if (!password || !confirm) return null;
  return password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LucideAngularModule, FwButtonComponent],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  readonly ArrowLeft = ArrowLeft;
  readonly KeyRound = KeyRound;
  readonly Mail = Mail;
  readonly ShieldCheck = ShieldCheck;
  readonly Lock = Lock;
  readonly RefreshCcw = RefreshCcw;

  isLoading = signal(false);

  resetForm = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: passwordMatchValidator }
  );

  constructor() {
    const emailFromQuery = this.route.snapshot.queryParamMap.get('email');
    if (emailFromQuery) {
      this.resetForm.patchValue({ email: emailFromQuery });
    }
  }

  isInvalid(controlName: string): boolean {
    const control = this.resetForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(controlName: string): string {
    const control = this.resetForm.get(controlName);
    if (control?.hasError('required')) return 'Ce champ est obligatoire';
    if (control?.hasError('email')) return 'Format email invalide';
    if (control?.hasError('pattern')) return 'Le code doit contenir 6 chiffres';
    if (control?.hasError('minlength')) return 'Le mot de passe doit contenir au moins 8 caractères';
    return 'Champ invalide';
  }

  get hasPasswordMismatch(): boolean {
    const form = this.resetForm;
    return !!(form.hasError('passwordMismatch') && (form.get('confirmPassword')?.touched || form.touched));
  }

  onSubmit() {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      this.notificationService.warning('Vérifiez les champs du formulaire.', 'Formulaire incomplet');
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
        this.notificationService.success('Mot de passe réinitialisé avec succès.', 'Opération terminée');
        this.router.navigate(['/auth/login']);
      },
      error: (err: any) => {
        const message = err?.error?.message || err?.message || 'Impossible de réinitialiser le mot de passe.';
        this.notificationService.error(message, 'Échec de réinitialisation');
        this.isLoading.set(false);
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }
}
