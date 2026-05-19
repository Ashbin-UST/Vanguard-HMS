import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  loginForm: FormGroup;
  constructor(private fb: FormBuilder, private router: Router, private http: HttpClient) {
    this.loginForm = this.fb.group({
      email: [''],
      password: ['']
    });
  }
  onSubmit() {
    console.log(this.loginForm.value);
    this.http.post(

      'http://localhost:5000/api/auth/login',

      this.loginForm.value

    ).subscribe({
      next: (response: any) => {
        console.log("Login Success");
        console.log(response);
        localStorage.setItem('token', response.token);

        this.router.navigate(['/dashboard']);
      },
      error: (error) => {

        console.log("LOGIN FAILED");

        console.log(error);

      }

    });
  }
}
