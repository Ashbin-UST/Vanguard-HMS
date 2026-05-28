import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ROLES, Role } from '../../../core/models/user.model';
import { DEPARTMENTS, Department } from '../../../core/models/employee.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-primary-50 to-white py-12 px-4">
      <div class="max-w-4xl mx-auto">
        <div class="bg-white rounded-2xl shadow-xl p-8">
          <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-slate-900">Employee Registration</h2>
            <p class="text-slate-600 mt-2">Join our hospital management team</p>
          </div>

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <div class="grid md:grid-cols-2 gap-6">
              
              <!-- Name -->
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  formControlName="name"
                  class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="John Doe"
                />
                @if (registerForm.get('name')?.invalid && registerForm.get('name')?.touched) {
                  <p class="text-red-500 text-sm mt-1">Name is required</p>
                }
              </div>

              <!-- Email -->
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">Email *</label>
                <input
                  type="email"
                  formControlName="email"
                  class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="john.doe@hospital.com"
                />
                @if (registerForm.get('email')?.invalid && registerForm.get('email')?.touched) {
                  <p class="text-red-500 text-sm mt-1">Valid email is required</p>
                }
              </div>

              <!-- Phone -->
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">Phone *</label>
                <input
                  type="tel"
                  formControlName="phone"
                  class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="+1234567890"
                />
                @if (registerForm.get('phone')?.invalid && registerForm.get('phone')?.touched) {
                  <p class="text-red-500 text-sm mt-1">Phone is required</p>
                }
              </div>

              <!-- Department -->
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">Department *</label>
                <select
                  formControlName="department"
                  class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select Department</option>
                  @for (dept of departments; track dept) {
                    <option [value]="dept">{{ dept }}</option>
                  }
                </select>
                @if (registerForm.get('department')?.invalid && registerForm.get('department')?.touched) {
                  <p class="text-red-500 text-sm mt-1">Department is required</p>
                }
              </div>

              <!-- Role -->
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">Role *</label>
                <select
                  formControlName="roles"
                  (change)="onRoleChange()"
                  class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select Role</option>
                  @for (role of roles; track role) {
                    <option [value]="role">{{ role }}</option>
                  }
                </select>
                @if (registerForm.get('roles')?.invalid && registerForm.get('roles')?.touched) {
                  <p class="text-red-500 text-sm mt-1">Role is required</p>
                }
              </div>

              <!-- Designation -->
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">Designation *</label>
                <input
                  type="text"
                  formControlName="designation"
                  class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Senior Doctor"
                />
                @if (registerForm.get('designation')?.invalid && registerForm.get('designation')?.touched) {
                  <p class="text-red-500 text-sm mt-1">Designation is required</p>
                }
              </div>

              <!-- Medical Registration No (Conditional) -->
              @if (showMedicalFields) {
                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-2">Medical Registration No</label>
                  <input
                    type="text"
                    formControlName="medicalRegistrationNo"
                    class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="MED123456"
                  />
                </div>
              }

              <!-- Specialization (For Doctors) -->
              @if (selectedRole === 'DOCTOR') {
                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-2">Specialization</label>
                  <input
                    type="text"
                    formControlName="specialization"
                    class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Cardiology"
                  />
                </div>

                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-2">Consultation Fee</label>
                  <input
                    type="number"
                    formControlName="consultationFee"
                    class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="500"
                  />
                </div>
              }

              <!-- Password -->
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">Password *</label>
                <input
                  type="password"
                  formControlName="password"
                  class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Min 8 characters"
                />
                @if (registerForm.get('password')?.invalid && registerForm.get('password')?.touched) {
                  <p class="text-red-500 text-sm mt-1">Password must be at least 8 characters</p>
                }
              </div>

              <!-- Confirm Password -->
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">Confirm Password *</label>
                <input
                  type="password"
                  formControlName="confirmPassword"
                  class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Confirm password"
                />
                @if (registerForm.hasError('passwordMismatch') && registerForm.get('confirmPassword')?.touched) {
                  <p class="text-red-500 text-sm mt-1">Passwords do not match</p>
                }
              </div>
            </div>

            <!-- Error/Success Messages -->
            @if (errorMessage) {
              <div class="mt-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {{ errorMessage }}
              </div>
            }

            @if (successMessage) {
              <div class="mt-6 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                {{ successMessage }}
              </div>
            }

            <!-- Submit Button -->
            <div class="mt-8">
              <button
                type="submit"
                [disabled]="registerForm.invalid || loading"
                class="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                @if (loading) {
                  <span>Registering...</span>
                } @else {
                  <span>Register</span>
                }
              </button>
            </div>
          </form>

          <!-- Login Link -->
          <div class="mt-6 text-center">
            <p class="text-slate-600">
              Already have an account?
              <a routerLink="/login" class="text-primary-600 font-semibold hover:text-primary-700">
                Login here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `
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

  constructor() {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      department: ['', Validators.required],
      designation: ['', Validators.required],
      roles: ['', Validators.required],
      medicalRegistrationNo: [''],
      specialization: [''],
      qualification: [''],
      consultationFee: [null],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
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
    
    // Show medical fields for medical staff
    this.showMedicalFields = ['DOCTOR', 'NURSE', 'LAB_TECH', 'PHARMACIST'].includes(role);
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = { ...this.registerForm.value };
    delete formData.confirmPassword;

    // Convert roles to array
    formData.roles = [formData.roles];

    // Convert qualification to array if provided
    if (formData.qualification) {
      formData.qualification = [formData.qualification];
    }

    this.authService.selfRegister(formData).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = response.message;
          this.registerForm.reset();
          
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
      }
    });
  }
}