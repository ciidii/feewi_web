import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const publicGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    const user = authService.currentUser();
    
    // Redirect based on role
    if (user?.roles.includes('ROLE_SUPER_ADMIN')) {
      return router.createUrlTree(['/saas']);
    }
    
    // Default to school app
    return router.createUrlTree(['/']);
  }

  return true;
};
