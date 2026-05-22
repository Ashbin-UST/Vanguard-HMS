import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EmployeeService } from '../services/employee.service';
import { Employee } from '../models/user.model';

@Component({
  selector: 'app-employee-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './employee-create.html',
  styleUrl: './employee-create.css',
})
export class EmployeeCreateComponent implements OnInit {
  employeeForm: FormGroup;
  loading = false;
  error = '';
  isEditMode = false;
  employeeId = '';

  departments = [
    'OPD',
    'IPD',
    'Lab',
    'Pharmacy',
    'Administration',
    'Reception',
    'Billing',
  ];

  designations = [
    'Doctor',
    'Nurse',
    'Lab Technician',
    'Pharmacist',
    'Receptionist',
    'Admin Staff',
    'Billing Officer',
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly employeeService: EmployeeService,
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute
  ) {
    this.employeeForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      department: ['', Validators.required],
      designation: ['', Validators.required],
      qualifications: [''],
      specialization: [''],
      experience: [''],
    });
  }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.employeeId = params['id'];
        this.loadEmployee();
      }
    });
  }

  loadEmployee(): void {
    this.loading = true;
    this.employeeService.getEmployeeById(this.employeeId).subscribe({
      next: (response: any) => {
        const employee = response.employee || response;
        this.employeeForm.patchValue({
          name: employee.name,
          email: employee.email,
          phone: employee.phone,
          department: employee.department,
          designation: employee.designation,
          qualifications: employee.qualifications || '',
          specialization: employee.specialization || '',
          experience: employee.experience || '',
        });
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Failed to load employee';
        this.loading = false;
      },
    });
  }

  submitForm(): void {
    if (this.employeeForm.invalid) {
      this.error = 'Please fill all required fields correctly';
      return;
    }

    this.loading = true;
    const formData = this.employeeForm.value;

    if (this.isEditMode) {
      this.employeeService.updateEmployee(this.employeeId, formData).subscribe({
        next: () => {
          alert('Employee updated successfully');
          this.router.navigate(['/employees']);
        },
        error: (err: any) => {
          this.error = err.error?.message || 'Failed to update employee';
          this.loading = false;
        },
      });
    } else {
      this.employeeService.createEmployee(formData).subscribe({
        next: () => {
          alert('Employee created successfully');
          this.router.navigate(['/employees']);
        },
        error: (err: any) => {
          this.error = err.error?.message || 'Failed to create employee';
          this.loading = false;
        },
      });
    }
  }

  cancelForm(): void {
    this.router.navigate(['/employees']);
  }

  getFieldError(fieldName: string): string {
    const field = this.employeeForm.get(fieldName);
    if (field?.hasError('required')) {
      return `${fieldName} is required`;
    }
    if (field?.hasError('email')) {
      return 'Invalid email format';
    }
    if (field?.hasError('minlength')) {
      return `${fieldName} must be at least 2 characters`;
    }
    if (field?.hasError('pattern')) {
      return 'Phone must be 10 digits';
    }
    return '';
  }
}
