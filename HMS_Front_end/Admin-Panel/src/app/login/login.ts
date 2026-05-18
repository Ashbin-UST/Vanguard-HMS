import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { Auth } from '../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  loginForm: FormGroup;

  showPassword = false;

  errorMsg = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: Auth,
    private readonly router: Router
  ) {

    this.loginForm = this.fb.group({

      email: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],

      password: [
        '',
        [
          Validators.required,
          Validators.minLength(6)
        ]
      ],
    });
  }

  togglePwd(): void {

    this.showPassword =
      !this.showPassword;
  }

  onSubmit(): void {

    console.log('BUTTON CLICKED');

    if (this.loginForm.valid) {

      this.errorMsg = '';

      console.log(this.loginForm.value);

      this.authService.login(this.loginForm.value)
        .subscribe({

          next: (res: any) => {

            console.log(res);

            localStorage.setItem(
              'token',
              res.token
            );

            this.router.navigate([
              '/dashboard'
            ]);
          },

          error: (err) => {

            console.log(err);

            this.errorMsg =
              'Login failed';
          }
        });

    } else {

      this.errorMsg =
        'The username or password is incorrect.';

      this.loginForm.markAllAsTouched();
    }
  }

  get emailInvalid() {

    const ctrl =
      this.loginForm.get('email');

    return ctrl?.invalid &&
      ctrl?.touched;
  }

  get passwordInvalid() {

    const ctrl =
      this.loginForm.get('password');

    return ctrl?.invalid &&
      ctrl?.touched;
  }
}