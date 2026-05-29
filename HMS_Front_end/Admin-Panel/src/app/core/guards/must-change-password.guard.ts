import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Forces a first-login user (admin-created account with a temporary password)
 * to change their password before accessing any protected area.
 *
 * Applied to every /dashboard/* route: if the authenticated user still has
 * mustChangePassword === true, they are redirected to /change-password and
 * cannot reach the dashboard by typing a URL directly.
 */
export const mustChangePasswordGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.getCurrentUser();

  if (user?.mustChangePassword) {
    return router.createUrlTree(['/change-password']);
  }

  return true;
};
