import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DashboardLayoutComponent } from '../../../shared/ui/dashboard-layout/dashboard-layout';
import { AdminService } from '../../../core/services/admin.service';
import { OwnerService } from '../../../core/services/owner.service';
import { ToastService } from '../../../core/services/toast.service';
import { FormDraftService } from '../../../core/services/form-draft.service';
import { CanComponentDeactivate } from '../../../core/guards/unsaved-changes.guard';
import {
  Designation,
  STAFF_DESIGNATIONS,
  DEPARTMENTS,
  WEEK_DAYS,
  MEDICAL_DESIGNATIONS,
  SPECIALIZATION_DESIGNATIONS,
} from '../../../core/models/employee.model';
import {
  phoneValidator,
  notBlank,
  nonNegative,
} from '../../../core/validators/app-validators';


@Component({
  selector: 'app-create-employee',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DashboardLayoutComponent],
  templateUrl: './employees-create.html',
  styleUrl: './employees-create.css',
})
export class CreateEmployeeComponent
  implements OnInit, CanComponentDeactivate
{
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);
  private ownerService = inject(OwnerService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private formDraft = inject(FormDraftService);

  mode: 'staff' | 'admin' = 'staff';
  form: FormGroup;
  loading = false;
  submittedOk = false;

  departments = DEPARTMENTS;
  weekDays = WEEK_DAYS;
  designations: Designation[] = [...STAFF_DESIGNATIONS];
  isDoctor = false;
  showMedical = false;
  showSpecialization = false;

  constructor() {
    this.form = this.fb.group({
      name: ['', [Validators.required, notBlank]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, phoneValidator]],
      department: ['', Validators.required],
      designation: ['', Validators.required],
      joiningDate: ['', Validators.required],
      qualification: ['', [Validators.required, notBlank]],
      medicalRegistrationNumber: [''],
      specialization: [''],
      consultationFee: [null, nonNegative],
      availabilitySlots: this.fb.array([]),
    });
  }

  get availabilitySlots(): FormArray {
    return this.form.get('availabilitySlots') as FormArray;
  }

  get draftKey(): string {
    return `draft:create-${this.mode}`;
  }

  ngOnInit(): void {
    this.mode =
      (this.route.snapshot.data['mode'] as 'staff' | 'admin') || 'staff';

    if (this.mode === 'admin') {
      // For admin creation, designation is fixed.
      this.designations = ['ADMIN'];
      this.form.patchValue({ designation: 'ADMIN', department: 'Administration' });
    }

    // Restore draft
    const draft = this.formDraft.get(this.draftKey);
    if (draft) {
      const slots = Array.isArray(draft['availabilitySlots'])
        ? draft['availabilitySlots']
        : [];
      slots.forEach(() => this.addSlot());
      this.form.patchValue(draft);
      this.onDesignationChange();
    }

    this.form.valueChanges.subscribe(() => {
      if (!this.submittedOk) {
        this.formDraft.save(this.draftKey, this.form.getRawValue());
      }
    });
  }

  addSlot(): void {
    this.availabilitySlots.push(
      this.fb.group({
        day: ['MONDAY', Validators.required],
        startTime: ['09:00', Validators.required],
        endTime: ['17:00', Validators.required],
      }),
    );
  }

  removeSlot(i: number): void {
    this.availabilitySlots.removeAt(i);
  }

  onDesignationChange(): void {
    const d = this.form.get('designation')?.value as Designation;
    this.isDoctor = d === 'DOCTOR';
    this.showMedical = MEDICAL_DESIGNATIONS.includes(d);
    this.showSpecialization = SPECIALIZATION_DESIGNATIONS.includes(d);

    const med = this.form.get('medicalRegistrationNumber');
    const spec = this.form.get('specialization');
    const fee = this.form.get('consultationFee');

    med?.setValidators(this.showMedical ? [Validators.required] : []);
    spec?.setValidators(this.showSpecialization ? [Validators.required] : []);
    fee?.setValidators(
      this.isDoctor ? [Validators.required, nonNegative] : [nonNegative],
    );

    if (this.isDoctor && this.availabilitySlots.length === 0) {
      this.addSlot();
    }
    if (!this.isDoctor) {
      this.availabilitySlots.clear();
    }

    med?.updateValueAndValidity();
    spec?.updateValueAndValidity();
    fee?.updateValueAndValidity();
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty && !this.submittedOk;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('Please fix the highlighted fields.');
      return;
    }

    const raw = this.form.getRawValue();
    const payload: any = {
      
      name: raw.name,
      email: raw.email,
      phone: raw.phone,
      department: raw.department,
      designation: raw.designation,
      joiningDate: raw.joiningDate,
      qualification: String(raw.qualification)
        .split(',')
        .map((q: string) => q.trim())
        .filter((q: string) => q.length > 0),
    };
    if (this.showMedical && raw.medicalRegistrationNumber) {
      payload.medicalRegistrationNumber = raw.medicalRegistrationNumber;
    }
    if (this.showSpecialization && raw.specialization) {
      payload.specialization = raw.specialization;
    }
    if (this.isDoctor) {
      payload.consultationFee = Number(raw.consultationFee);
      payload.availabilitySlots = raw.availabilitySlots;
    }

    this.loading = true;
    const call =
      this.mode === 'admin'
        ? this.ownerService.createAdmin(payload)
        : this.adminService.createEmployee(payload);

    call.subscribe({
      next: (res) => {
        this.loading = false;
        this.cdr.markForCheck();
        this.submittedOk = true;
        this.formDraft.clear(this.draftKey);
        this.toast.success(
          res.message ||
            `${this.mode === 'admin' ? 'Admin' : 'Employee'} created. Credentials sent via email.`,
        );
        this.router.navigate([
          this.mode === 'admin' ? '/dashboard/admins' : '/dashboard/employees',
        ]);
      },
      error: (err) => {
        this.loading = false;
        this.cdr.markForCheck();
        this.toast.error(err.error?.message || 'Failed to create.');
      },
    });
  }

  onCancel(): void {
    this.router.navigate([
      this.mode === 'admin' ? '/dashboard/admins' : '/dashboard/employees',
    ]);
  }
}
