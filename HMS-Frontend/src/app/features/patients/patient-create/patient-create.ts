import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PatientService } from '../../../core/services/patient.service';
import { AuthService } from '../../../core/services/auth.service';
import { GENDERS } from '../../../core/models/patient.model';

@Component({
  selector: 'app-patient-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './patient-create.html',
  styleUrl: './patient-create.scss'
})
export class PatientCreateComponent {
  private fb = inject(FormBuilder);
  private patientService = inject(PatientService);
  private authService = inject(AuthService);
  private router = inject(Router);

  patientForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  genders = GENDERS;

  constructor() {
    this.patientForm = this.fb.group({
      name: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      gender: ['', Validators.required],
      dob: ['', Validators.required],
      addressLine1: [''],
      addressCity: [''],
      addressPostcode: [''],
      emergencyName: [''],
      emergencyPhone: [''],
      emergencyRelation: [''],
      medicalHistory: ['']
    });
  }

  onSubmit(): void {
    if (this.patientForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formValue = this.patientForm.value;

    const patientData: any = {
      name: formValue.name,
      phone: formValue.phone,
      email: formValue.email,
      gender: formValue.gender,
      dob: formValue.dob,
      medicalHistory: formValue.medicalHistory || ''
    };

    // Address (only if any field filled)
    if (formValue.addressLine1 || formValue.addressCity || formValue.addressPostcode) {
      patientData.address = {
        line1: formValue.addressLine1,
        city: formValue.addressCity,
        postcode: formValue.addressPostcode
      };
    }

    // Emergency contact (only if any field filled)
    if (formValue.emergencyName || formValue.emergencyPhone) {
      patientData.emergencyContact = {
        name: formValue.emergencyName,
        phone: formValue.emergencyPhone,
        relation: formValue.emergencyRelation
      };
    }

    this.patientService.createPatient(patientData).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = `Patient registered successfully! UHID: ${response.data?.UHID}`;
          this.patientForm.reset();

          setTimeout(() => {
            const basePath = this.getBasePath();
            this.router.navigate([`${basePath}/patients`]);
          }, 2000);
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to create patient';
        this.loading = false;
      }
    });
  }

  goBack(): void {
    const basePath = this.getBasePath();
    this.router.navigate([`${basePath}/patients`]);
  }

  private getBasePath(): string {
    if (this.authService.hasRole(['ADMIN', 'OWNER'])) return '/admin';
    return '/receptionist';
  }
}