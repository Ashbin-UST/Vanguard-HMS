import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth } from '../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  loginForm: FormGroup;
  errorMsg = '';

  constructor(private fb: FormBuilder, private authService: Auth, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.errorMsg = '';
      this.authService.login(this.loginForm.value).subscribe({
        next: (res: any) => {
          if (res.token) localStorage.setItem('token', res.token);
          this.router.navigate(['/dashboard']);
        },
        error: () => {
          this.errorMsg = 'Login failed. Check your credentials.';
        },
      });
    } else {
      this.errorMsg = 'The username or password is incorrect.';
      this.loginForm.markAllAsTouched();
    }
  }

  get emailInvalid() {
    const c = this.loginForm.get('email');
    return c?.invalid && c?.touched;
  }

  get passwordInvalid() {
    const c = this.loginForm.get('password');
    return c?.invalid && c?.touched;
  }
}