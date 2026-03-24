import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="auth-minimal-container">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .auth-minimal-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background-color: #f8fafc;
      padding: 1.5rem;
    }
  `]
})
export class AuthLayoutComponent {}
