import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterModule, CommonModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  signupForm: FormGroup;
  designations = [
    'DOCTOR',
    'NURSE',
    'RECEPTIONIST',
    'ADMIN',
    'CASHIER',
    'LAB_TECH',
    'PHARMACIST'
  ];
  departments = [
    'OPD',
    'IPD',
    'LAB',
    'Pharmacy',
    'Admin'
  ];
  constructor(private fb: FormBuilder, private router: Router, private http: HttpClient) {
    this.signupForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      designation: ['', Validators.required],
      department: ['', Validators.required],
      qualification: [''],
      specialization: [''],
      medicalRegistrationNumber: [''],
      consultationFee: [0],
      joiningDate: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      availabilitySlots: this.fb.array([])
    }, { validators: this.passwordMatchValidator }
    );
  }
  get availabilitySlots(): FormArray {
    return this.signupForm.get('availabilitySlots') as FormArray;
  }
  getSlotGroup(index: number): FormGroup {
    return this.availabilitySlots.at(index) as FormGroup;
  }
  addSlot() {
    const slot = this.fb.group({
      day: [''],
      startTime: [''],
      endTime: ['']
    });
    this.availabilitySlots.push(slot);
  }
  removeSlot(index: number) {
    this.availabilitySlots.removeAt(index);
  }
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (password === confirmPassword) {
      return null;
    } else {
      return { mismatch: true };
    }
  }
  isDoctor(): boolean {
    return this.signupForm.value.designation === 'DOCTOR';
  }
  onSubmit() {
    if (this.signupForm.valid) {
      console.log(this.signupForm.value);
      const payload = {
        ...this.signupForm.value
      };
      console.log(payload);
      this.http.post('http://localhost:5000/api/auth/signup', payload)
        .subscribe({
          next: (response: any) => {
            console.log("Signup Success");
            console.log(response);
            localStorage.setItem('token', response.token);
            this.router.navigate(['/dashboard']);
          },
          error: (error) => {
            console.log("Sign up failed");
            console.log(error);
          }
        });
    }

  }
}
