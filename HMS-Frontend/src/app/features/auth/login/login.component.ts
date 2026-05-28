import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <div class="max-w-md w-full">
        <div class="bg-white rounded-2xl shadow-xl p-8">
          <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-slate-900">Welcome Back</h2>
            <p class="text-slate-600 mt-2">Login to your account</p>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <!-- Email -->
            <div class="mb-6">
              <label class="block text-sm font-semibold text-slate-700 mb-2">Email</label>
              <input
                type="email"
                formControlName="email"
                class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="your.email@hospital.com"
              />
              @if (loginForm.get('email')?.invalid && loginForm.get('email')?.touched) {
                <p class="text-red-500 text-sm mt-1">Valid email is required</p>
              }
            </div>

            <!-- Password -->
            <div class="mb-6">
              <label class="block text-sm font-semibold text-slate-700 mb-2">Password</label>
              <input
                type="password"
                formControlName="password"
                class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="••••••••"
              />
              @if (loginForm.get('password')?.invalid && loginForm.get('password')?.touched) {
                <p class="text-red-500 text-sm mt-1">Password is required</p>
              }
            </div>

            <!-- Forgot Password -->
            <div class="mb-6 text-right">
              <a routerLink="/forgot-password" class="text-sm text-primary-600 hover:text-primary-700">
                Forgot Password?
              </a>
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
              [disabled]="loginForm.invalid || loading"
              class="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              @if (loading) {
                <span>Logging in...</span>
              } @else {
                <span>Login</span>
              }
            </button>
          </form>

          <!-- Register Link -->
          <div class="mt-6 text-center">
            <p class="text-slate-600">
              Don't have an account?
              <a routerLink="/register" class="text-primary-600 font-semibold hover:text-primary-700">
                Register as Employee
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup;
  loading = false;
  errorMessage = '';

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const user = response.data;
          
          // Redirect based on role
          if (user.roles.includes('ADMIN') || user.roles.includes('OWNER')) {
            this.router.navigate(['/admin/dashboard']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Login failed. Please try again.';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}