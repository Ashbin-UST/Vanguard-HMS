import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router,RouterModule } from '@angular/router';
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
  imports: [CommonModule, ReactiveFormsModule,RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  loginForm: FormGroup;
  signupForm: FormGroup;
  showPassword = false;
  showSignUp = false;
  errorMsg = '';

  constructor(private fb: FormBuilder,  private authService: Auth, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
    this.signupForm = this.fb.group({
      fullName: ['',Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    })
}

  togglePwd() {
    this.showPassword = !this.showPassword;
  }
  passwordsDoNotMatch() {
  const password = this.signupForm.get('password')?.value;
  const confirmPassword = this.signupForm.get('confirmPassword')?.value;

  return password !== confirmPassword;
}

  onSubmit() {
     console.log('BUTTON CLICKED');
    if (this.loginForm.valid) {
      this.errorMsg = '';
      console.log(this.loginForm.value);
      // TODO: call your AuthService here
     this.authService.login(this.loginForm.value)
  .subscribe({
    next: (res:any) => {
  
  console.log(res);
  localStorage.setItem('token',res.token)

  this.router.navigate(['/dashboard']);

 
},

    error: (err) => {
      console.log(err);
      this.errorMsg = 'Login failed';
    }
  });
    } else {
      this.errorMsg = 'The username or password is incorrect.';
      this.loginForm.markAllAsTouched(); // triggers validation UI
    }
  } 

  onSignup() {

  if (this.signupForm.invalid || this.passwordsDoNotMatch()) {
    this.signupForm.markAllAsTouched();
    return;
  }

  console.log(this.signupForm.value);

  const signupData = {
  name: this.signupForm.value.fullName,
  email: this.signupForm.value.email,
  password: this.signupForm.value.password,
}; 

  this.authService.signup(signupData)
    .subscribe({

      next: (res) => {
        console.log(res);

        alert('Signup successful');

        this.signupForm.reset();

        this.router.navigate(['/dashboard']);
      },

      
      

      error: (err) => {
        console.log(err.error);
      }

    });
}

  // Helpers to check field state cleanly in the template
  get emailInvalid() {
    const ctrl = this.loginForm.get('email');
    return ctrl?.invalid && ctrl?.touched;
  }

  get passwordInvalid() {
    const ctrl = this.loginForm.get('password');
    return ctrl?.invalid && ctrl?.touched;
  }
}