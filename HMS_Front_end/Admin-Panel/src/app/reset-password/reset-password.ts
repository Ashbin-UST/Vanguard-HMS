import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css'
})
export class ResetPassword implements OnInit {

  private fb      = inject(FormBuilder);
  private route   = inject(ActivatedRoute);
  private authService = inject(AuthService);

  resetForm: FormGroup;

  // ── Page state ─────────────────────────────────────────────
  loading      = false;
  success      = false;
  errorMessage = '';
  tokenMissing = false;

  private resetToken = '';

  constructor() {
    this.resetForm = this.fb.group(
      {
        newPassword: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/)
          ]
        ],
        confirmPassword: ['', Validators.required]
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    // Read ?token= from the URL that the backend sends in the reset email
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.tokenMissing = true;
      return;
    }

    this.resetToken = token;
  }

  // ── Validator ──────────────────────────────────────────────

  passwordMatchValidator(form: FormGroup) {
    const newPassword     = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }

    return null;
  }

  // ── Submit ─────────────────────────────────────────────────

  onSubmit(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.loading      = true;
    this.errorMessage = '';

    const { newPassword, confirmPassword } = this.resetForm.value;

    this.authService
      .resetPassword({
        resetToken: this.resetToken,
        newPassword,
        confirmPassword
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.success = true;
        },
        error: (err) => {
          this.loading      = false;
          this.errorMessage = err.error?.message || 'Password reset failed. Please try again.';
        }
      });
  }
}