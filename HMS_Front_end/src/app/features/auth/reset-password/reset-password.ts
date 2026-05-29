import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  passwordComplexity,
  passwordMatchValidator,
} from '../../../core/validators/app-validators';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  resetPasswordForm: FormGroup;
  loading = false;
  errorMessage = '';
  passwordReset = false;
  submitted = false;
  // Set when the backend rejects because the new password equals the old one.
  sameAsCurrent = false;
  token = '';

  constructor() {
    this.resetPasswordForm = this.fb.group(
      {
        newPassword: ['', [Validators.required, Validators.minLength(8), passwordComplexity]],
        confirmPassword: ['', Validators.required],
      },
      { validators: passwordMatchValidator('newPassword', 'confirmPassword') },
    );

    // Clear the server-side "same as current" error once the user edits the
    // new password again.
    this.resetPasswordForm.get('newPassword')?.valueChanges.subscribe(() => {
      this.sameAsCurrent = false;
    });
  }

  ngOnInit(): void {
    // The reset email links to /reset-password?token=...
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.errorMessage = 'Invalid or missing reset link.';
    }
  }

  onSubmit(): void {
    this.submitted = true;
    this.sameAsCurrent = false;

    if (this.resetPasswordForm.invalid || !this.token) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { newPassword, confirmPassword } = this.resetPasswordForm.value;

    // Backend expects { resetToken, newPassword, confirmPassword }.
    this.authService
      .resetPassword(this.token, newPassword, confirmPassword)
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.cdr.markForCheck();
          this.passwordReset = true;
          this.toast.success(
            response?.message || 'Password reset successfully.',
          );
        },
        error: (error) => {
          this.loading = false;
          this.cdr.markForCheck();
          const msg = error.error?.message || '';

          // The backend rejects a new password equal to the current one; show
          // it under the new-password field rather than just as a toast.
          if (/same as current/i.test(msg)) {
            this.sameAsCurrent = true;
            this.toast.error(msg);
            return;
          }

          this.errorMessage =
            msg || 'Failed to reset password. Link may be expired.';
          this.toast.error(this.errorMessage);
        },
      });
  }
}
