import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. Check Authentication
  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  // 2. Check Roles (Optional)
  const requiredRoles = route.data['roles'] as string[];
  if (requiredRoles && requiredRoles.length > 0) {
    const user = authService.currentUser();
    const hasRole = user?.roles.some(role => requiredRoles.includes(role));

    if (!hasRole) {
      console.warn(`User does not have required roles: ${requiredRoles}`);
      // If super admin is required but user is not, or vice versa, redirect to a safe place
      // For now, redirect to root or show error. Let's redirect to root which will handle the user's domain.
      return router.createUrlTree(['/']);
    }
  }

  return true;
};
