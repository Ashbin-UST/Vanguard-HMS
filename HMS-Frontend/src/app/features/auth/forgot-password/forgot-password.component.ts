import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <div class="max-w-md w-full">
        <div class="bg-white rounded-2xl shadow-xl p-8">
          <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-slate-900">Forgot Password?</h2>
            <p class="text-slate-600 mt-2">Enter your email to reset your password</p>
          </div>

          @if (!emailSent) {
            <form [formGroup]="forgotPasswordForm" (ngSubmit)="onSubmit()">
              <!-- Email -->
              <div class="mb-6">
                <label class="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  formControlName="email"
                  class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="your.email@hospital.com"
                />
                @if (forgotPasswordForm.get('email')?.invalid && forgotPasswordForm.get('email')?.touched) {
                  <p class="text-red-500 text-sm mt-1">Valid email is required</p>
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
                [disabled]="forgotPasswordForm.invalid || loading"
                class="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-slate-300"
              >
                @if (loading) {
                  <span>Sending...</span>
                } @else {
                  <span>Send Reset Link</span>
                }
              </button>
            </form>
          } @else {
            <div class="text-center">
              <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="text-3xl">✓</span>
              </div>
              <p class="text-slate-700 mb-6">
                Password reset link has been sent to your email. Please check your inbox.
              </p>
              <a routerLink="/login" class="text-primary-600 font-semibold hover:text-primary-700">
                Back to Login
              </a>
            </div>
          }

          <!-- Back to Login -->
          @if (!emailSent) {
            <div class="mt-6 text-center">
              <a routerLink="/login" class="text-primary-600 hover:text-primary-700">
                ← Back to Login
              </a>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  forgotPasswordForm: FormGroup;
  loading = false;
  errorMessage = '';
  emailSent = false;

  constructor() {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    const { email } = this.forgotPasswordForm.value;

    this.authService.forgotPassword(email).subscribe({
      next: (response) => {
        if (response.success) {
          this.emailSent = true;
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Failed to send reset link. Please try again.';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}