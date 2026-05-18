import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth } from '../services/auth';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  signupForm: FormGroup;
  errorMsg = '';

  constructor(private fb: FormBuilder, private authService: Auth, private router: Router) {
    this.signupForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    });
  }

  passwordsDoNotMatch(): boolean {
    const p = this.signupForm.get('password')?.value;
    const cp = this.signupForm.get('confirmPassword')?.value;
    if (!cp) return false;
    return p !== cp;
  }

  onSignup() {
    if (this.signupForm.invalid || this.passwordsDoNotMatch()) {
      this.signupForm.markAllAsTouched();
      return;
    }

    const payload = {
      name: this.signupForm.value.fullName,
      email: this.signupForm.value.email,
      password: this.signupForm.value.password,
    };

    this.authService.signup(payload).subscribe({
      next: () => {
        // No toggle needed — just navigate, login component loads fresh
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Signup failed. Try again.';
      },
    });
  }
}