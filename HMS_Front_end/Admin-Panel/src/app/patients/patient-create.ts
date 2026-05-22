import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PatientService } from '../services/patient.service';
import { Patient, CreatePatientRequest, Address, EmergencyContact } from '../models/patient.model';

@Component({
  selector: 'app-patient-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './patient-create.html',
  styleUrl: './patient-create.css',
})
export class PatientCreateComponent implements OnInit {
  patientForm: FormGroup;
  loading = false;
  error = '';
  isEditing = false;
  patientId: string | null = null;

  genderOptions = ['Male', 'Female'];
  statusOptions = ['ACTIVE', 'INACTIVE'];

  constructor(
    private readonly fb: FormBuilder,
    private readonly patientService: PatientService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {
    this.patientForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      gender: ['', Validators.required],
      dob: ['', Validators.required],
      houseName: ['', Validators.required],
      houseNumber: ['', Validators.required],
      city: ['', Validators.required],
      postCode: ['', Validators.required],
      contactName: ['', Validators.required],
      relationship: ['', Validators.required],
      contactNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      status: ['ACTIVE', Validators.required],
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      if (params.has('id')) {
        this.isEditing = true;
        this.patientId = params.get('id');
        this.loadPatient(this.patientId!);
      }
    });
  }

  loadPatient(id: string): void {
    this.loading = true;
    this.patientService.getPatientById(id).subscribe({
      next: (patient: Patient) => {
        this.patientForm.patchValue({
          name: patient.name,
          phone: patient.phone,
          email: patient.email,
          gender: patient.gender,
          dob: new Date(patient.dob).toISOString().split('T')[0],
          houseName: patient.address.houseName,
          houseNumber: patient.address.houseNumber,
          city: patient.address.city,
          postCode: patient.address.postCode,
          contactName: patient.emergencyContact.contactName,
          relationship: patient.emergencyContact.relationship,
          contactNumber: patient.emergencyContact.contactNumber,
          status: patient.status,
        });
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Failed to load patient';
        this.loading = false;
      },
    });
  }

  onSubmit(): void {
    if (this.patientForm.invalid) {
      alert('Please fill in all required fields correctly');
      return;
    }

    this.loading = true;

    const formValue = this.patientForm.value;
    const patientData: CreatePatientRequest = {
      name: formValue.name,
      phone: formValue.phone,
      email: formValue.email,
      gender: formValue.gender,
      dob: new Date(formValue.dob),
      address: {
        houseName: formValue.houseName,
        houseNumber: formValue.houseNumber,
        city: formValue.city,
        postCode: formValue.postCode,
      },
      emergencyContact: {
        contactName: formValue.contactName,
        relationship: formValue.relationship,
        contactNumber: formValue.contactNumber,
      },
      status: formValue.status,
    };

    if (this.isEditing && this.patientId) {
      this.patientService.updatePatient(this.patientId, patientData).subscribe({
        next: () => {
          alert('Patient updated successfully');
          this.router.navigate(['/patients']);
          this.loading = false;
        },
        error: (err: any) => {
          this.error = err.error?.message || 'Failed to update patient';
          this.loading = false;
        },
      });
    } else {
      this.patientService.createPatient(patientData).subscribe({
        next: () => {
          alert('Patient created successfully');
          this.router.navigate(['/patients']);
          this.loading = false;
        },
        error: (err: any) => {
          this.error = err.error?.message || 'Failed to create patient';
          this.loading = false;
        },
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/patients']);
  }
}
