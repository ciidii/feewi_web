import { Component, inject, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { LucideAngularModule, Lock, Mail, Loader2, Eye, EyeOff } from 'lucide-angular';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    LucideAngularModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  isLoading = signal(false);
  loginError = signal(false);
  showPassword = signal(false);

  readonly Mail = Mail;
  readonly Lock = Lock;
  readonly Loader2 = Loader2;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  async onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.loginError.set(false);

    const { email, password } = this.loginForm.value;
    const success = await this.authService.login(email!, password!);

    if (success) {
      this.router.navigate(['/dashboard']);
    } else {
      this.loginError.set(true);
      this.isLoading.set(false);
    }
  }
}
