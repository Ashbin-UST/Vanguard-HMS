import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {

  registerForm: FormGroup;

  selectedDesignation = '';

  // ── Slot state ────────────────────────────────────────────
  availabilitySlots: { day: string; startTime: string; endTime: string }[] = [];
  slotErrorMessage = '';

  // ── Dropdown options ──────────────────────────────────────
  departments = [
    'OPD',
    'IPD',
    'Lab',
    'Pharmacy',
    'Administration',
    'Reception',
    'Billing'
  ];

  designations = [
    'DOCTOR',
    'NURSE',
    'RECEPTIONIST',
    'CASHIER',
    'LAB_TECH',
    'PHARMACIST'
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group(
      {
        // ── Identity ───────────────────────────────────────
        username: ['', Validators.required],

        name: ['', Validators.required],

        phone: [
          '',
          [
            Validators.required,
            Validators.pattern(/^[0-9]{10}$/)
          ]
        ],

        email: [
          '',
          [
            Validators.required,
            Validators.email
          ]
        ],

        // ── Employment ─────────────────────────────────────
        department:  ['', Validators.required],

        designation: ['', Validators.required],

        joiningDate: ['', Validators.required],

        // ── Conditional fields ─────────────────────────────
        medicalRegistrationNumber: [''],

        qualification: [''],

        specialization: [''],

        // ── Doctor-only: consultation fee ──────────────────
        consultationFee: [''],

        // ── Doctor-only: slot picker helpers (UI only) ─────
        day:       [''],
        startTime: [''],
        endTime:   [''],

        // ── Password ───────────────────────────────────────
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8)
          ]
        ],

        confirmPassword: ['', Validators.required]
      },
      {
        validators: this.passwordMatchValidator
      }
    );
  }

  // ── Validators ────────────────────────────────────────────

  passwordMatchValidator(form: FormGroup) {
    const password        = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      return { passwordMismatch: true };
    }

    return null;
  }

  // ── Designation change ────────────────────────────────────

  onDesignationChange(): void {
    this.selectedDesignation = this.registerForm.get('designation')?.value;

    // Clear slot data when switching away from DOCTOR
    if (this.selectedDesignation !== 'DOCTOR') {
      this.availabilitySlots = [];
      this.slotErrorMessage  = '';
      this.registerForm.patchValue({ day: '', startTime: '', endTime: '' });
    }
  }

  // ── Conditional field visibility ──────────────────────────

  get showQualification(): boolean {
    return [
      'DOCTOR',
      'NURSE',
      'PHARMACIST',
      'LAB_TECH',
      'RECEPTIONIST',
      'CASHIER'
    ].includes(this.selectedDesignation);
  }

  // Backend medicalFields: DOCTOR, NURSE, LAB_TECH, PHARMACIST
  get showMedicalFields(): boolean {
    return [
      'DOCTOR',
      'NURSE',
      'LAB_TECH',
      'PHARMACIST'
    ].includes(this.selectedDesignation);
  }

  // Backend specializationFields: DOCTOR, LAB_TECH
  get showSpecialisation(): boolean {
    return ['DOCTOR', 'LAB_TECH'].includes(this.selectedDesignation);
  }

  get showDoctorFields(): boolean {
    return this.selectedDesignation === 'DOCTOR';
  }

  // ── Slot management ───────────────────────────────────────

  addSlot(): void {
    const day       = this.registerForm.get('day')?.value;
    const startTime = this.registerForm.get('startTime')?.value;
    const endTime   = this.registerForm.get('endTime')?.value;

    if (!day || !startTime || !endTime) {
      this.slotErrorMessage = 'Please select a day, start time, and end time.';
      return;
    }

    if (startTime >= endTime) {
      this.slotErrorMessage = 'Start time must be before end time.';
      return;
    }

    const duplicate = this.availabilitySlots.some(
      s => s.day === day && s.startTime === startTime && s.endTime === endTime
    );

    if (duplicate) {
      this.slotErrorMessage = 'This slot has already been added.';
      return;
    }

    this.availabilitySlots = [...this.availabilitySlots, { day, startTime, endTime }];
    this.slotErrorMessage  = '';
    this.registerForm.patchValue({ day: '', startTime: '', endTime: '' });
  }

  removeSlot(index: number): void {
    this.availabilitySlots = this.availabilitySlots.filter((_, i) => i !== index);
  }

  // ── Submit ────────────────────────────────────────────────

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const raw = { ...this.registerForm.value };

    // Not sent to backend
    delete raw.confirmPassword;
    delete raw.day;
    delete raw.startTime;
    delete raw.endTime;

    // Convert "MBBS, Bsc, Bcom" → ["MBBS", "Bsc", "Bcom"]
    if (typeof raw.qualification === 'string') {
      raw.qualification = raw.qualification
        .split(',')
        .map((q: string) => q.trim())
        .filter((q: string) => q.length > 0);
    }

    // Attach slot objects for doctors; drop the field otherwise
    if (this.selectedDesignation === 'DOCTOR') {
      raw.availabilitySlots = this.availabilitySlots;
    } else {
      delete raw.availabilitySlots;
    }

    // Strip blank optional fields so backend validators don't fire on empty strings
    if (!raw.medicalRegistrationNumber) delete raw.medicalRegistrationNumber;
    if (!raw.specialization)            delete raw.specialization;
    if (!raw.consultationFee)           delete raw.consultationFee;

    this.authService.register(raw).subscribe({
      next: () => {
        this.registerForm.reset();
        this.availabilitySlots = [];
        this.router.navigate(['/verify-email']);
      },
      error: (err) => {
        alert(err.error?.message || 'Registration failed');
      }
    });
  }
}