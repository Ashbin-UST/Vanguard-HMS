import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Auth } from '../services/auth';
import { MatSnackBar } from '@angular/material/snack-bar';


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

  designations = [
    'OWNER', 'DOCTOR', 'NURSE', 'RECEPTIONIST',
    'CASHIER', 'LAB_TECH', 'PHARMACIST', 'ADMIN'
  ];

  departments = ['OPD', 'IPD', 'LAB', 'PHARMACY', 'ADMIN'];

  constructor(
    private fb: FormBuilder,
    private authService: Auth,
    private router: Router,
     private snackBar: MatSnackBar
    // private toastr:ToastrService
  ) {
    this.signupForm = this.fb.group({
      // common
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.minLength(10)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      designation: ['', Validators.required],
      department: [''],
      joiningDate: [''],

      // doctor only
      medicalRegistrationNumber: [''],
      specialisation: [''],
      consultationFee: [0],
      qualifications: this.fb.array([]),
      availabilitySlots: this.fb.array([]),
    });
  }

  get selectedRole(): string {
    return this.signupForm.get('designation')?.value || '';
  }

  get isDoctor(): boolean {
    return this.selectedRole === 'DOCTOR';
  }

  get isNurseOrLabTech(): boolean {
    return this.selectedRole === 'NURSE' || this.selectedRole === 'LAB_TECH';
  }

  get qualifications(): FormArray {
    return this.signupForm.get('qualifications') as FormArray;
  }

  get availabilitySlots(): FormArray {
    return this.signupForm.get('availabilitySlots') as FormArray;
  }

  addQualification() {
    this.qualifications.push(this.fb.control('', Validators.required));
  }

  removeQualification(i: number) {
    this.qualifications.removeAt(i);
  }

  addSlot() {
    this.availabilitySlots.push(
      this.fb.group({
        day: ['', Validators.required],
        startTime: ['', Validators.required],
        endTime: ['', Validators.required],
      })
    );
  }

  removeSlot(i: number) {
    this.availabilitySlots.removeAt(i);
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

    const v = this.signupForm.value;

    const payload: any = {
      name: v.fullName,
      email: v.email,
      password: v.password,
      phone: v.phone || undefined,
      designation: v.designation || undefined,
      department: v.department || undefined,
      joiningDate: v.joiningDate || undefined,
    };

    if (this.isDoctor) {
      payload.medicalRegistrationNumber = v.medicalRegistrationNumber || undefined;
      payload.specialisation = v.specialisation || undefined;
      payload.consultationFee = v.consultationFee || 0;
      payload.qualification = v.qualifications.filter((q: string) => q.trim());
      payload.availabilitySlots = v.availabilitySlots;
    }

    if (this.isNurseOrLabTech) {
      payload.qualification = v.qualifications.filter((q: string) => q.trim());
    }

    this.authService.signup(payload).subscribe({
      next: () => { 
        
        this.snackBar.open(
        'Signup successful!',
        'Close',
        { duration: 8000 }
        );
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Signup failed. Try again.';
      },
    });
  }
}