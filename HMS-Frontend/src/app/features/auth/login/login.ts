import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
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

        // Route based on role
        if (user.roles.includes('ADMIN') || user.roles.includes('OWNER')) {
          this.router.navigate(['/admin/dashboard']);
        } else if (user.roles.includes('DOCTOR')) {
          this.router.navigate(['/doctor/dashboard']);
        } else if (user.roles.includes('RECEPTIONIST')) {
          this.router.navigate(['/receptionist/dashboard']);
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