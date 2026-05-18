import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class Signup {

  signupForm: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly http: HttpClient
  ) {

    this.signupForm = this.fb.group({

      username: ['', Validators.required],

      name: ['', Validators.required],

      phone: ['', Validators.required],

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

      confirmPassword: ['', Validators.required],

      department: ['', Validators.required],

      designation: ['', Validators.required],

      joiningDate: ['', Validators.required],

      qualification: ['', Validators.required],

      medicalRegistrationNumber: [''],

      specialization: [''],

      consultationFee: [''],

      day: [''],

      startTime: [''],

      endTime: ['']
    });
  }

  passwordsDoNotMatch(): boolean {

    const password =
      this.signupForm.get('password')?.value;

    const confirmPassword =
      this.signupForm.get('confirmPassword')?.value;

    return password !== confirmPassword;
  }

  onSignup(): void {

    if (
      this.signupForm.invalid ||
      this.passwordsDoNotMatch()
    ) {

      this.signupForm.markAllAsTouched();
      return;
    }

    const formValue = this.signupForm.value;

    const payload: any = {

      username: formValue.username,

      name: formValue.name,

      phone: formValue.phone,

      email: formValue.email,

      password: formValue.password,

      department: formValue.department,

      designation: formValue.designation,

      joiningDate: formValue.joiningDate,

      qualification: [
        formValue.qualification
      ],

      roles: [
        formValue.designation
      ]
    };

    // Medical staff fields

    if (
      ['DOCTOR', 'NURSE', 'LAB_TECH', 'PHARMACIST']
        .includes(formValue.designation)
    ) {

      payload.medicalRegistrationNumber =
        formValue.medicalRegistrationNumber;
    }

    // Specialization fields

    if (
      ['DOCTOR', 'LAB_TECH']
        .includes(formValue.designation)
    ) {

      payload.specialization =
        formValue.specialization;
    }

    // Doctor-only fields

    if (
      formValue.designation === 'DOCTOR'
    ) {

      payload.consultationFee =
        formValue.consultationFee;

      payload.availabilitySlots = [
        {
          day: formValue.day,
          startTime: formValue.startTime,
          endTime: formValue.endTime
        }
      ];
    }

    console.log(payload);

    this.http.post(
      'http://localhost:5000/api/auth/signup',
      payload
    ).subscribe({

      next: (res) => {

        console.log(res);

        alert('Signup successful');

        this.signupForm.reset();
      },

      error: (err) => {

        console.log(err.error);
      }
    });
  }
}