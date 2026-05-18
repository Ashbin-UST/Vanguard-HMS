import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  signupForm: FormGroup;

  currentStep = 1;

  availabilitySlots: any[] = [];

  slotErrorMessage = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {
    this.signupForm = this.fb.group({
      username: ['', Validators.required],

      name: ['', Validators.required],

      phone: ['', Validators.required],

      email: ['', [Validators.required, Validators.email]],

      password: ['', [Validators.required, Validators.minLength(6)]],

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

      endTime: [''],
    });
  }

  passwordsDoNotMatch(): boolean {
    const password = this.signupForm.get('password')?.value;

    const confirmPassword = this.signupForm.get('confirmPassword')?.value;

    return password !== confirmPassword;
  }

  isStepOneValid(): boolean {
    const username = this.signupForm.get('username');
    const email = this.signupForm.get('email');
    const password = this.signupForm.get('password');
    const confirmPassword = this.signupForm.get('confirmPassword');

    return !!(
      username?.valid &&
      email?.valid &&
      password?.valid &&
      confirmPassword?.valid &&
      !this.passwordsDoNotMatch()
    );
  }

  isStepTwoValid(): boolean {
    const name = this.signupForm.get('name');
    const phone = this.signupForm.get('phone');
    const department = this.signupForm.get('department');
    const designation = this.signupForm.get('designation');
    const joiningDate = this.signupForm.get('joiningDate');
    const qualification = this.signupForm.get('qualification');

    return !!(
      name?.valid &&
      phone?.valid &&
      department?.valid &&
      designation?.valid &&
      joiningDate?.valid &&
      qualification?.valid
    );
  }

  isStepThreeValid(): boolean {
    const designation = this.signupForm.get('designation')?.value;
    const medicalRegistrationNumber = this.signupForm.get('medicalRegistrationNumber');
    const specialization = this.signupForm.get('specialization');
    const consultationFee = this.signupForm.get('consultationFee');

    // Doctor validation
    if (designation === 'DOCTOR') {
      return !!(
        medicalRegistrationNumber?.valid &&
        specialization?.valid &&
        consultationFee?.valid &&
        this.availabilitySlots.length > 0
      );
    }

    // Lab Technician validation
    if (designation === 'LAB_TECH') {
      return !!(medicalRegistrationNumber?.valid && specialization?.valid);
    }

    // Nurse / Pharmacist validation
    if (['NURSE', 'PHARMACIST'].includes(designation)) {
      return !!medicalRegistrationNumber?.valid;
    }

    // Other designations
    return true;
  }

  isMedicalRole(): boolean {
    const designation = this.signupForm.get('designation')?.value;

    return ['DOCTOR', 'NURSE', 'LAB_TECH', 'PHARMACIST'].includes(designation);
  }

  nextStep() {
    if (this.currentStep === 1 && !this.isStepOneValid()) {
      this.signupForm.get('username')?.markAsTouched();
      this.signupForm.get('email')?.markAsTouched();
      this.signupForm.get('password')?.markAsTouched();
      this.signupForm.get('confirmPassword')?.markAsTouched();
      return;
    }

    if (this.currentStep === 2 && !this.isStepTwoValid()) {
      this.signupForm.get('name')?.markAsTouched();
      this.signupForm.get('phone')?.markAsTouched();
      this.signupForm.get('department')?.markAsTouched();
      this.signupForm.get('designation')?.markAsTouched();
      this.signupForm.get('joiningDate')?.markAsTouched();
      this.signupForm.get('qualification')?.markAsTouched();
      return;
    }

    this.currentStep++;
  }

  previousStep() {
    this.currentStep--;
  }

  addSlot() {
    const day = this.signupForm.get('day')?.value;
    const startTime = this.signupForm.get('startTime')?.value;
    const endTime = this.signupForm.get('endTime')?.value;

    const existingSlot = this.availabilitySlots.find(
      (slot) => slot.day === day && slot.startTime === startTime && slot.endTime === endTime,
    );

    if (!day) {
      this.slotErrorMessage = 'Please select a day.';
      return;
    }

    if (!startTime) {
      this.slotErrorMessage = 'Please select a start time.';
      return;
    }

    if (!endTime) {
      this.slotErrorMessage = 'Please select an end time.';
      return;
    }

    if (startTime >= endTime) {
      this.slotErrorMessage = 'Start time must be before end time.';
      return;
    }

    if (existingSlot) {
      this.slotErrorMessage = 'A slot for this time period already exists.';
      return;
    }

    this.availabilitySlots.push({ day, startTime, endTime });
    // Clear the slot fields and error message
    this.slotErrorMessage = '';
    this.signupForm.get('day')?.reset();
    this.signupForm.get('startTime')?.reset();
    this.signupForm.get('endTime')?.reset();
  }

  onSignup(): void {
    if (this.signupForm.invalid || this.passwordsDoNotMatch()) {
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

      qualification: formValue.qualification
        .split(',')
        .map((q: string) => q.trim())
        .filter((q: string) => q),

      roles: [formValue.designation],
    };

    // Medical staff fields

    if (['DOCTOR', 'NURSE', 'LAB_TECH', 'PHARMACIST'].includes(formValue.designation)) {
      payload.medicalRegistrationNumber = formValue.medicalRegistrationNumber;
    }

    // Specialization fields

    if (['DOCTOR', 'LAB_TECH'].includes(formValue.designation)) {
      payload.specialization = formValue.specialization;
    }

    // Doctor-only fields

    if (formValue.designation === 'DOCTOR') {
      payload.consultationFee = formValue.consultationFee;

      payload.availabilitySlots = this.availabilitySlots;
    }

    console.log(payload);

    this.http.post('http://localhost:5000/api/auth/signup', payload).subscribe({
      next: (res) => {
        console.log(res);

        alert('Signup successful');

        this.signupForm.reset();

        this.currentStep = 1;

        this.availabilitySlots = [];

        this.router.navigate(['']);
      },

      error: (err) => {
        console.log(err.error);

        alert(err.error?.message || 'Signup failed');
      },
    });
  }
}
