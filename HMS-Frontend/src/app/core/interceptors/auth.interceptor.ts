import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toastService = inject(ToastService);
  const router = inject(Router);

  // Step 1: Attach token to every request
  const token = authService.getToken();
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Step 2: Catch errors globally
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {

      switch (error.status) {

        case 401:
          // Token expired or invalid → logout and redirect
          toastService.error('Session expired. Please login again.');
          authService.logout();
          break;

        case 403:
          // Logged in but not allowed
          toastService.error('Access denied. You do not have permission.');
          router.navigate(['/dashboard']);
          break;

        case 500:
          // Server crashed
          toastService.error('Server error. Please try again later.');
          break;

        case 0:
          // No internet / server unreachable
          toastService.error('Cannot reach server. Check your connection.');
          break;
      }

      // Always re-throw so component error handlers still work
      return throwError(() => error);
    })
  );
};