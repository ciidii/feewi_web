import {Component, inject, signal, ViewEncapsulation} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterModule} from '@angular/router';
import {AlertCircle, Eye, EyeOff, HelpCircle, Loader2, Lock, LucideAngularModule, Mail} from 'lucide-angular';
import {AuthService} from '../../../../core/services/auth.service';
import {LoadingService} from '../../../../shared/services/loading.service';
import {FwButtonComponent} from '../../../../shared/components/button/button.component';
import {FwAlertBannerComponent} from '../../../../shared/components/alert-banner/alert-banner.component';
import {TranslateModule, TranslateService} from '@ngx-translate/core';

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
  private loadingService = inject(LoadingService);
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

  get emailInvalid(): boolean {
    const ctrl = this.loginForm.get('email');
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  get emailError(): string {
    const ctrl = this.loginForm.get('email');
    if (ctrl?.hasError('required')) return 'auth.login.fields.email.errors.required';
    if (ctrl?.hasError('email'))    return 'auth.login.fields.email.errors.invalid';
    return '';
  }

  get passwordInvalid(): boolean {
    const ctrl = this.loginForm.get('password');
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  get passwordError(): string {
    const ctrl = this.loginForm.get('password');
    if (ctrl?.hasError('required'))   return 'auth.login.fields.password.errors.required';
    if (ctrl?.hasError('minlength'))  return 'auth.login.fields.password.errors.minlength';
    return '';
  }

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

    const { email, password, rememberMe } = this.loginForm.value;

    this.authService.login(email!, password!, rememberMe ?? false).subscribe({
      next: (success) => {
        if (success) {
          // Déclenche le Splash Screen Global pour une transition "Premium"
          this.loadingService.start('global');
          const roles = this.authService.currentUser()?.roles ?? [];
          const isParentOnly = roles.includes('ROLE_PARENT') && !roles.some(r => ['ROLE_ADMIN', 'ROLE_SECRETARY', 'ROLE_SUPER_ADMIN'].includes(r));
          this.router.navigate([isParentOnly ? '/parent/dashboard' : '/admin/home']);
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
