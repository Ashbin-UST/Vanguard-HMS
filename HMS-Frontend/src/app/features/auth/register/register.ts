import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ROLES, Role, DEPARTMENTS, Department } from '../../../core/models/user.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.scss'],
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  roles = ROLES;
  departments = DEPARTMENTS;
  selectedRole: Role | null = null;
  showMedicalFields = false;

  // ── ★ NEW: Chip-based arrays ★ ──────────────────────────────
  qualificationChips: string[] = [];
  newQualification = '';

  availabilityChips: string[] = [];
  newAvailabilitySlot = '';

  // Pre-built common time slots for quick add
  commonTimeSlots = [
    '09:00-12:00',
    '09:00-13:00',
    '10:00-13:00',
    '14:00-17:00',
    '14:00-18:00',
    '18:00-21:00',
  ];

  constructor() {
    this.registerForm = this.fb.group(
      {
        name: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', Validators.required],
        department: ['', Validators.required],
        designation: ['', Validators.required],
        roles: ['', Validators.required],
        medicalRegistrationNo: [''],
        specialization: [''],
        consultationFee: [null],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onRoleChange(): void {
    const role = this.registerForm.get('roles')?.value as Role;
    this.selectedRole = role;
    this.showMedicalFields = ['DOCTOR', 'NURSE', 'LAB_TECH', 'PHARMACIST'].includes(role);
  }

  // ── ★ Qualification chips ★ ───────────────────────────────────
  addQualification(): void {
    const trimmed = this.newQualification.trim();
    if (trimmed && !this.qualificationChips.includes(trimmed)) {
      this.qualificationChips = [...this.qualificationChips, trimmed];
    }
    this.newQualification = '';
  }

  removeQualification(index: number): void {
    this.qualificationChips = this.qualificationChips.filter((_, i) => i !== index);
  }

  // ── ★ Availability slot chips ★ ───────────────────────────────
  addAvailabilitySlot(): void {
    const trimmed = this.newAvailabilitySlot.trim();
    const regex = /^\d{2}:\d{2}-\d{2}:\d{2}$/;

    if (!trimmed) return;

    if (!regex.test(trimmed)) {
      this.errorMessage = 'Time slot must be in HH:MM-HH:MM format (e.g. 09:00-12:00)';
      setTimeout(() => (this.errorMessage = ''), 4000);
      return;
    }

    if (!this.availabilityChips.includes(trimmed)) {
      this.availabilityChips = [...this.availabilityChips, trimmed];
    }
    this.newAvailabilitySlot = '';
  }

  addCommonSlot(slot: string): void {
    if (!this.availabilityChips.includes(slot)) {
      this.availabilityChips = [...this.availabilityChips, slot];
    }
  }

  removeAvailabilitySlot(index: number): void {
    this.availabilityChips = this.availabilityChips.filter((_, i) => i !== index);
  }

  // ── Submit ────────────────────────────────────────────────────
  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = { ...this.registerForm.value };
    delete formData.confirmPassword;

    // Role → array
    formData.roles = [formData.roles];

    // ★ Qualification: send chip array (fall back to empty array)
    formData.qualification =
      this.qualificationChips.length > 0 ? this.qualificationChips : [];

    // ★ Availability slots: send chip array
    formData.availabilitySlots =
      this.availabilityChips.length > 0 ? this.availabilityChips : [];

    this.authService.selfRegister(formData).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = response.message;
          this.registerForm.reset();
          this.qualificationChips = [];
          this.availabilityChips = [];
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
      },
      complete: () => {
        this.loading = false;
      },
    });
  }
}