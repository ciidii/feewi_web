import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {AuthService} from '../services/auth.service';

export const publicGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log(`[publicGuard] Checking public route: ${state.url}`);

  if (authService.isAuthenticated()) {
    const user = authService.currentUser();
    console.warn(`[publicGuard] User already authenticated (${user?.email}). Redirecting to app.`);

    // Redirect based on role
    if (user?.roles.includes('ROLE_SUPER_ADMIN')) {
      return router.createUrlTree(['/saas']);
    }

    // Default to school app
    return router.createUrlTree(['/']);
  }

  return true;
};
