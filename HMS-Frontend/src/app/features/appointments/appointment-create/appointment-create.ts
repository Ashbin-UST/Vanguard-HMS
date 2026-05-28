import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PatientService } from '../../../core/services/patient.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { AuthService } from '../../../core/services/auth.service';
import { Patient } from '../../../core/models/patient.model';
import { AvailableDoctor, AvailableSlots, APPOINTMENT_TYPES } from '../../../core/models/appointment.model';
import { DEPARTMENTS } from '../../../core/models/user.model';

@Component({
  selector: 'app-appointment-create',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './appointment-create.html',
  styleUrl: './appointment-create.scss'
})
export class AppointmentCreateComponent implements OnInit {
  private patientService = inject(PatientService);
  private appointmentService = inject(AppointmentService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  // Wizard step
  currentStep = 1;
  totalSteps = 5;

  // Step 1: Patient
  patientSearchQuery = '';
  patientSearchResults: Patient[] = [];
  selectedPatient: Patient | null = null;
  searchingPatient = false;

  // Step 2: Doctor
  availableDoctors: AvailableDoctor[] = [];
  selectedDoctor: AvailableDoctor | null = null;
  doctorFilter = '';
  departmentFilter = '';
  loadingDoctors = false;
  departments = DEPARTMENTS;

  // Step 3: Date
  selectedDate = '';
  minDate = '';

  // Step 4: Time Slot
  availableSlots: AvailableSlots | null = null;
  selectedSlot = '';
  loadingSlots = false;

  // Step 5: Confirm
  appointmentForm: FormGroup;
  appointmentTypes = APPOINTMENT_TYPES;

  // Submit
  submitting = false;
  errorMessage = '';
  successMessage = '';

  constructor() {
    this.appointmentForm = this.fb.group({
      appointmentType: ['Consultation', Validators.required],
      reasonForVisit: ['', Validators.required],
      consultationFee: [0, [Validators.required, Validators.min(0)]]
    });

    // Set min date to today
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    // Check if patientId passed via query params
    const patientId = this.route.snapshot.queryParamMap.get('patientId');
    if (patientId) {
      this.loadPatientById(patientId);
    }
  }

  // --- Step 1: Patient Selection ---

  searchPatients(): void {
    if (!this.patientSearchQuery || this.patientSearchQuery.trim().length < 2) return;

    this.searchingPatient = true;
    this.patientService.searchPatients(this.patientSearchQuery.trim()).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.patientSearchResults = response.data;
        }
        this.searchingPatient = false;
      },
      error: () => { this.searchingPatient = false; }
    });
  }

  loadPatientById(id: string): void {
    this.patientService.getPatientById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedPatient = response.data;
          this.currentStep = 2;
          this.loadDoctors();
        }
      }
    });
  }

  selectPatient(patient: Patient): void {
    this.selectedPatient = patient;
    this.nextStep();
  }

  // --- Step 2: Doctor Selection ---

  loadDoctors(): void {
    this.loadingDoctors = true;

    const filters: any = {};
    if (this.doctorFilter) filters.specialization = this.doctorFilter;
    if (this.departmentFilter) filters.department = this.departmentFilter;

    this.appointmentService.getAvailableDoctors(filters).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.availableDoctors = response.data;
        }
        this.loadingDoctors = false;
      },
      error: () => { this.loadingDoctors = false; }
    });
  }

  onDoctorFilterChange(): void {
    this.loadDoctors();
  }

  selectDoctor(doctor: AvailableDoctor): void {
    this.selectedDoctor = doctor;
    this.appointmentForm.patchValue({
      consultationFee: doctor.consultationFee || 0
    });
    this.nextStep();
  }

  // --- Step 3: Date Selection ---

  onDateChange(): void {
    if (this.selectedDate && this.selectedDoctor) {
      this.loadAvailableSlots();
    }
  }

  confirmDate(): void {
    if (!this.selectedDate) return;
    this.loadAvailableSlots();
    this.nextStep();
  }

  // --- Step 4: Time Slot Selection ---

  loadAvailableSlots(): void {
    if (!this.selectedDoctor || !this.selectedDate) return;

    this.loadingSlots = true;
    this.appointmentService.getAvailableSlots(this.selectedDoctor._id, this.selectedDate).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.availableSlots = response.data;
        }
        this.loadingSlots = false;
      },
      error: () => { this.loadingSlots = false; }
    });
  }

  selectSlot(slot: string): void {
    this.selectedSlot = slot;
    this.nextStep();
  }

  // --- Step 5: Confirm & Submit ---

  onSubmit(): void {
    if (this.appointmentForm.invalid || !this.selectedPatient || !this.selectedDoctor || !this.selectedDate || !this.selectedSlot) return;

    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const appointmentData = {
      patientId: this.selectedPatient._id,
      doctorEmployeeId: this.selectedDoctor._id,
      date: this.selectedDate,
      timeSlot: this.selectedSlot,
      department: this.selectedDoctor.department,
      appointmentType: this.appointmentForm.value.appointmentType,
      reasonForVisit: this.appointmentForm.value.reasonForVisit,
      consultationFee: this.appointmentForm.value.consultationFee
    };

    this.appointmentService.createAppointment(appointmentData).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = `Appointment booked successfully! ID: ${response.data?.appointmentId}`;
          setTimeout(() => {
            const basePath = this.getBasePath();
            this.router.navigate([`${basePath}/appointments`]);
          }, 2000);
        }
        this.submitting = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to book appointment';
        this.submitting = false;
      }
    });
  }

  // --- Navigation ---

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;

      if (this.currentStep === 2) this.loadDoctors();
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goBack(): void {
    const basePath = this.getBasePath();
    this.router.navigate([`${basePath}/appointments`]);
  }

  getFormattedDate(): string {
    if (!this.selectedDate) return '';
    return new Date(this.selectedDate).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private getBasePath(): string {
    if (this.authService.hasRole(['ADMIN', 'OWNER'])) return '/admin';
    return '/receptionist';
  }
}