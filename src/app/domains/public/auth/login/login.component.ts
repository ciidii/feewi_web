import { Component, inject, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule, Lock, Mail, Loader2, Eye, EyeOff, AlertCircle, HelpCircle } from 'lucide-angular';
import { AuthService } from '../../../../core/services/auth.service';
import { FwButtonComponent } from '../../../../shared/components/button/button.component';
import { FwAlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    LucideAngularModule,
    FwButtonComponent,
    FwAlertBannerComponent,
    TranslateModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  public translate = inject(TranslateService);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false]
  });

  isLoading = signal(false);
  loginError = signal(false);
  showPassword = signal(false);

  readonly Mail = Mail;
  readonly Lock = Lock;
  readonly Loader2 = Loader2;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly AlertCircle = AlertCircle;
  readonly HelpCircle = HelpCircle;

  changeLanguage(lang: string) {
    this.translate.use(lang);
    localStorage.setItem('feewi_lang', lang);
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.loginError.set(false);

    const { email, password } = this.loginForm.value;
    
    this.authService.login(email!, password!).subscribe({
      next: (success) => {
        if (success) {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.loginError.set(true);
          this.isLoading.set(false);
        }
      },
      error: () => {
        this.loginError.set(true);
        this.isLoading.set(false);
      }
    });
  }
}
