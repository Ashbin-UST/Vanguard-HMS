import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Router } from '@angular/router';

// Endpoints where a 401 is an expected "bad credentials" case, not a session
// expiry — we must not force-logout / redirect for these.
const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/self-register',
];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toastService = inject(ToastService);
  const router = inject(Router);

  // Attach the bearer token to every outgoing request.
  const token = authService.getToken();
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  const isPublicAuthCall = PUBLIC_AUTH_PATHS.some((p) => req.url.includes(p));

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      switch (error.status) {
        case 401:
          // Bad credentials on a public auth call are surfaced by the
          // component itself; only treat 401 elsewhere as session expiry.
          if (!isPublicAuthCall) {
            toastService.error('Session expired. Please login again.');
            authService.forceClearSession();
          }
          break;

        case 403:
          toastService.error('Access denied. You do not have permission.');
          router.navigate(['/dashboard/overview']);
          break;

        case 0:
          toastService.error('Cannot reach server. Check your connection.');
          break;
      }

      // Re-throw so component-level handlers can react too.
      return throwError(() => error);
    }),
  );
};
