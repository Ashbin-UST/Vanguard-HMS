import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../../../core/services/employee.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Employee } from '../../../../core/models/employee.model';

@Component({
  selector: 'app-employee-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-edit.html',
  styleUrl: './employee-edit.scss',   // ★ FIXED: singular, not styleUrls
})
export class EmployeeEditComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private employeeService = inject(EmployeeService);
  private toastService = inject(ToastService);

  employeeId: string = '';
  loading = true;
  submitting = false;

  form = {
    name: '',
    phone: '',
    email: '',
    department: '' as string,
    designation: '',
    medicalRegistrationNo: '',
    specialization: '',
    qualification: [] as string[],
    consultationFee: null as number | null,
    availabilitySlots: [] as string[],
    status: 'ACTIVE' as string,
  };

  departments: string[] = ['OPD', 'IPD', 'Lab', 'Pharmacy', 'Admin'];
  statuses: string[] = ['ACTIVE', 'INACTIVE'];
  newQualification = '';

  ngOnInit(): void {
    this.employeeId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.employeeId) {
      this.toastService.error('Employee ID not found');
      this.router.navigate(['/admin/employees']);
      return;
    }
    this.loadEmployee();
  }

  loadEmployee(): void {
    this.loading = true;
    this.employeeService.getEmployeeById(this.employeeId).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          const emp = res.data;
          this.form = {
            name: emp.name || '',
            phone: emp.phone || '',
            email: emp.email || '',
            department: emp.department || '',
            designation: emp.designation || '',
            medicalRegistrationNo: emp.medicalRegistrationNo || '',
            specialization: emp.specialization || '',
            qualification: emp.qualification || [],
            consultationFee: emp.consultationFee ?? null,
            availabilitySlots: emp.availabilitySlots || [],
            status: emp.status || 'ACTIVE',
          };
        }
        this.loading = false;
      },
      error: (err: any) => {
        this.toastService.error(err.error?.message || 'Failed to load employee');
        this.loading = false;
        this.router.navigate(['/admin/employees']);
      },
    });
  }

  addQualification(): void {
    const trimmed = this.newQualification.trim();
    if (trimmed && !this.form.qualification.includes(trimmed)) {
      this.form.qualification = [...this.form.qualification, trimmed];
    }
    this.newQualification = '';
  }

  removeQualification(index: number): void {
    this.form.qualification = this.form.qualification.filter(
      (_q: string, i: number) => i !== index
    );
  }

  removeAvailabilitySlot(index: number): void {
    this.form.availabilitySlots = this.form.availabilitySlots.filter(
      (_slot: string, i: number) => i !== index
    );
  }

  onSubmit(): void {
    if (!this.form.name || !this.form.phone || !this.form.email || !this.form.department) {
      this.toastService.error('Name, phone, email, and department are required');
      return;
    }

    this.submitting = true;

    const payload: Partial<Employee> = {
      name: this.form.name,
      phone: this.form.phone,
      email: this.form.email,
      department: this.form.department as any,
      designation: this.form.designation,
      medicalRegistrationNo: this.form.medicalRegistrationNo || undefined,
      specialization: this.form.specialization,
      qualification: this.form.qualification,
      consultationFee: this.form.consultationFee ?? undefined,
      availabilitySlots: this.form.availabilitySlots,
      status: this.form.status as any,
    };

    this.employeeService.updateEmployee(this.employeeId, payload).subscribe({
      next: (res: any) => {
        this.toastService.success(res.message || 'Employee updated successfully');
        this.submitting = false;
        this.router.navigate(['/admin/employees']);
      },
      error: (err: any) => {
        this.toastService.error(err.error?.message || 'Failed to update employee');
        this.submitting = false;
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/employees']);
  }
}