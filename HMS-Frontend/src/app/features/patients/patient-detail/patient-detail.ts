import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PatientService } from '../../../core/services/patient.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { AuthService } from '../../../core/services/auth.service';
import { Patient, GENDERS } from '../../../core/models/patient.model';
import { Appointment } from '../../../core/models/appointment.model';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './patient-detail.html',
  styleUrl: './patient-detail.scss'
})
export class PatientDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private patientService = inject(PatientService);
  private appointmentService = inject(AppointmentService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  patient: Patient | null = null;
  appointments: Appointment[] = [];
  loading = true;
  appointmentsLoading = false;

  // Edit mode
  editMode = false;
  editForm!: FormGroup;
  editLoading = false;
  editErrorMessage = '';
  editSuccessMessage = '';
  genders = GENDERS;

  // Active tab
  activeTab: 'details' | 'appointments' | 'edit' = 'details';

  ngOnInit(): void {
    const patientId = this.route.snapshot.paramMap.get('id');
    if (patientId) {
      this.loadPatient(patientId);
      this.loadPatientAppointments(patientId);
    }
  }

  loadPatient(id: string): void {
    this.loading = true;
    this.patientService.getPatientById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.patient = response.data;
          this.initEditForm();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading patient:', error);
        this.loading = false;
      }
    });
  }

  loadPatientAppointments(id: string): void {
    this.appointmentsLoading = true;
    this.appointmentService.getPatientAppointments(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.appointments = response.data;
        }
        this.appointmentsLoading = false;
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
        this.appointmentsLoading = false;
      }
    });
  }

  initEditForm(): void {
    if (!this.patient) return;

    this.editForm = this.fb.group({
      name: [this.patient.name, Validators.required],
      phone: [this.patient.phone, Validators.required],
      email: [this.patient.email, [Validators.required, Validators.email]],
      gender: [this.patient.gender, Validators.required],
      dob: [this.formatDateForInput(this.patient.dob), Validators.required],
      addressLine1: [this.patient.address?.line1 || ''],
      addressCity: [this.patient.address?.city || ''],
      addressPostcode: [this.patient.address?.postcode || ''],
      emergencyName: [this.patient.emergencyContact?.name || ''],
      emergencyPhone: [this.patient.emergencyContact?.phone || ''],
      emergencyRelation: [this.patient.emergencyContact?.relation || ''],
      medicalHistory: [this.patient.medicalHistory || ''],
      status: [this.patient.status]
    });
  }

  formatDateForInput(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  setActiveTab(tab: 'details' | 'appointments' | 'edit'): void {
    this.activeTab = tab;
  }

  onEditSubmit(): void {
    if (!this.editForm || this.editForm.invalid || !this.patient) return;

    this.editLoading = true;
    this.editErrorMessage = '';
    this.editSuccessMessage = '';

    const formValue = this.editForm.value;

    const updateData: any = {
      name: formValue.name,
      phone: formValue.phone,
      email: formValue.email,
      gender: formValue.gender,
      dob: formValue.dob,
      medicalHistory: formValue.medicalHistory,
      status: formValue.status,
      address: {
        line1: formValue.addressLine1,
        city: formValue.addressCity,
        postcode: formValue.addressPostcode
      },
      emergencyContact: {
        name: formValue.emergencyName,
        phone: formValue.emergencyPhone,
        relation: formValue.emergencyRelation
      }
    };

    this.patientService.updatePatient(this.patient._id, updateData).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.patient = response.data;
          this.editSuccessMessage = 'Patient updated successfully';
          setTimeout(() => {
            this.activeTab = 'details';
            this.editSuccessMessage = '';
          }, 2000);
        }
        this.editLoading = false;
      },
      error: (error) => {
        this.editErrorMessage = error.error?.message || 'Failed to update patient';
        this.editLoading = false;
      }
    });
  }

  bookAppointment(): void {
    const basePath = this.getBasePath();
    this.router.navigate([`${basePath}/book-appointment`], {
      queryParams: { patientId: this.patient?._id }
    });
  }

  viewAppointment(appointmentId: string): void {
    const basePath = this.getBasePath();
    this.router.navigate([`${basePath}/appointments`, appointmentId]);
  }

  goBack(): void {
    const basePath = this.getBasePath();
    this.router.navigate([`${basePath}/patients`]);
  }

  canEdit(): boolean {
    return this.authService.hasRole(['RECEPTIONIST', 'ADMIN', 'OWNER']);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'BOOKED': return 'status-booked';
      case 'COMPLETED': return 'status-completed';
      case 'CANCELLED': return 'status-cancelled';
      default: return '';
    }
  }

  private getBasePath(): string {
    if (this.authService.hasRole(['ADMIN', 'OWNER'])) return '/admin';
    return '/receptionist';
  }
}