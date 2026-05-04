import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {AuthService} from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log(`[authGuard] Checking route: ${state.url}`);

  // 1. Check Authentication
  if (!authService.isAuthenticated()) {
    console.warn(`[authGuard] User not authenticated. Redirecting to login.`);
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
      console.warn(`[authGuard] Access denied for ${state.url}. Required roles: ${requiredRoles}`);

      // Redirect to their specific "home" based on role to avoid loops
      if (user?.roles.includes('ROLE_SUPER_ADMIN')) {
        return router.createUrlTree(['/saas']);
      } else {
        // If they are a school user but hitting a route they can't access,
        // redirect to root only if they aren't already there.
        if (state.url === '/') {
          console.error('[authGuard] User has no access even to root. Check role configuration.');
          return router.createUrlTree(['/auth/login']);
        }
        return router.createUrlTree(['/']);
      }
    }
  }

  return true;
};
