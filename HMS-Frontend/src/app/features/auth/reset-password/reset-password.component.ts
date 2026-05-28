import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <div class="max-w-md w-full">
        <div class="bg-white rounded-2xl shadow-xl p-8">
          <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-slate-900">Reset Password</h2>
            <p class="text-slate-600 mt-2">Enter your new password</p>
          </div>

          @if (!passwordReset) {
            <form [formGroup]="resetPasswordForm" (ngSubmit)="onSubmit()">
              <!-- New Password -->
              <div class="mb-6">
                <label class="block text-sm font-semibold text-slate-700 mb-2">New Password</label>
                <input
                  type="password"
                  formControlName="newPassword"
                  class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Min 8 characters"
                />
                @if (resetPasswordForm.get('newPassword')?.invalid && resetPasswordForm.get('newPassword')?.touched) {
                  <p class="text-red-500 text-sm mt-1">Password must be at least 8 characters</p>
                }
              </div>

              <!-- Confirm Password -->
              <div class="mb-6">
                <label class="block text-sm font-semibold text-slate-700 mb-2">Confirm Password</label>
                <input
                  type="password"
                  formControlName="confirmPassword"
                  class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Confirm password"
                />
                @if (resetPasswordForm.hasError('passwordMismatch') && resetPasswordForm.get('confirmPassword')?.touched) {
                  <p class="text-red-500 text-sm mt-1">Passwords do not match</p>
                }
              </div>

              <!-- Error Message -->
              @if (errorMessage) {
                <div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {{ errorMessage }}
                </div>
              }

              <!-- Submit Button -->
              <button
                type="submit"
                [disabled]="resetPasswordForm.invalid || loading"
                class="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-slate-300"
              >
                @if (loading) {
                  <span>Resetting...</span>
                } @else {
                  <span>Reset Password</span>
                }
              </button>
            </form>
          } @else {
            <div class="text-center">
              <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="text-3xl">✓</span>
              </div>
              <p class="text-slate-700 mb-6">
                Your password has been reset successfully. You can now login with your new password.
              </p>
              <a routerLink="/login" 
                 class="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700">
                Go to Login
              </a>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  resetPasswordForm: FormGroup;
  loading = false;
  errorMessage = '';
  passwordReset = false;
  token = '';

  constructor() {
    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    
    if (!this.token) {
      this.errorMessage = 'Invalid reset link';
    }
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.resetPasswordForm.invalid || !this.token) return;

    this.loading = true;
    this.errorMessage = '';

    const { newPassword } = this.resetPasswordForm.value;

    this.authService.resetPassword(this.token, newPassword).subscribe({
      next: (response) => {
        if (response.success) {
          this.passwordReset = true;
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Failed to reset password. Link may be expired.';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}