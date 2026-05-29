import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  passwordComplexity,
  passwordMatchValidator,
  notSameAs,
} from '../../../core/validators/app-validators';

/**
 * Reusable change-password screen.
 *
 * - Forced mode (mustChangePassword === true): the user reached this page right
 *   after a first login with a temporary password. Cancel is hidden and the
 *   user is locked here (logout is blocked in AuthService; dashboard is blocked
 *   by mustChangePasswordGuard) until they successfully change the password.
 * - Voluntary mode: reached from the profile menu; a Cancel button returns to
 *   the dashboard.
 */
@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-password.html',
  styleUrl: './change-password.css',
})
export class ChangePasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  changeForm: FormGroup;
  loading = false;
  forced = false;
  submitted = false;

  constructor() {
    this.changeForm = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(8), passwordComplexity]],
        confirmPassword: ['', Validators.required],
      },
      {
        validators: [
          passwordMatchValidator('newPassword', 'confirmPassword'),
          notSameAs('newPassword', 'currentPassword'),
        ],
      },
    );
  }

  ngOnInit(): void {
    this.forced = this.authService.isPasswordChangeRequired();
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.changeForm.invalid) {
      this.changeForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const { currentPassword, newPassword, confirmPassword } =
      this.changeForm.value;

    this.authService
      .changePassword(currentPassword, newPassword, confirmPassword)
      .subscribe({
        next: (response) => {
          this.toast.success(
            response?.message || 'Password changed successfully.',
          );
          // Refresh the cached user so mustChangePassword becomes false, then
          // proceed to the dashboard (already authenticated — no re-login).
          this.authService.refreshCurrentUser().subscribe({
            next: () => {
              this.loading = false;
              this.cdr.markForCheck();
              this.router.navigate(['/dashboard/overview']);
            },
            error: () => {
              // Even if the refresh fails, the password changed; continue.
              this.loading = false;
              this.cdr.markForCheck();
              this.router.navigate(['/dashboard/overview']);
            },
          });
        },
        error: (error) => {
          this.loading = false;
          this.cdr.markForCheck();
          this.toast.error(
            error.error?.message ||
              'Failed to change password. Please try again.',
          );
        },
      });
  }

  onCancel(): void {
    if (this.forced) {
      return;
    }
    this.router.navigate(['/dashboard/overview']);
  }
}
