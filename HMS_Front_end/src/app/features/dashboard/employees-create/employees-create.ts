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
import { AvailabilitySlotsFormComponent } from '../../../shared/ui/availability-slots-form/availability-slots-form';
import { AdminService } from '../../../core/services/admin.service';
import { OwnerService } from '../../../core/services/owner.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { FormDraftService } from '../../../core/services/form-draft.service';
import { CanComponentDeactivate } from '../../../core/guards/unsaved-changes.guard';
import {
  Designation,
  Department,
  STAFF_DESIGNATIONS,
  DEPARTMENTS,
  DEPARTMENT_DESIGNATIONS,
  WEEK_DAYS,
  MEDICAL_DESIGNATIONS,
  SPECIALIZATION_DESIGNATIONS,
} from '../../../core/models/employee.model';
import {
  phoneValidator,
  notBlank,
  nonNegative,
  slotTimeOrder,
} from '../../../core/validators/app-validators';

/**
 * Reusable create-employee form.
 *
 *   route data: { mode: 'staff' } — POST /admin/create-employee (any staff
 *     designation). OWNER and ADMIN can access.
 *   route data: { mode: 'admin' } — POST /owner/create-admin (ADMIN only).
 *     OWNER access only (enforced by route guard).
 *
 * No password input — backend generates and emails a temporary password. The
 * created user is then forced through the change-password gate on first login.
 */
@Component({
  selector: 'app-create-employee',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DashboardLayoutComponent, AvailabilitySlotsFormComponent],
  templateUrl: './employees-create.html',
  styleUrl: './employees-create.css',
})
export class CreateEmployeeComponent
  implements OnInit, CanComponentDeactivate
{
  private readonly fb = inject(FormBuilder);
  private readonly adminService = inject(AdminService);
  private readonly ownerService = inject(OwnerService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formDraft = inject(FormDraftService);

  mode: 'staff' | 'admin' = 'staff';
  form: FormGroup;
  loading = false;
  submittedOk = false;

  departments = DEPARTMENTS;
  weekDays = WEEK_DAYS;
  designations: Designation[] = [...STAFF_DESIGNATIONS];
  isOwner = false;
  isDoctor = false;
  showMedical = false;
  showSpecialization = false;

  constructor() {
    this.form = this.fb.group({
      username: ['', [Validators.required, notBlank]],
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

    this.isOwner = this.authService.getDesignation() === 'OWNER';

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
      // Rebuild the designation list for the restored department, then refresh
      // the conditional (medical/fee) fields for the restored designation.
      if (this.mode !== 'admin') {
        this.refreshDesignationsForDepartment(false);
      }
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
      this.fb.group(
        {
          day: ['MONDAY', Validators.required],
          startTime: ['09:00', Validators.required],
          endTime: ['17:00', Validators.required],
        },
        { validators: slotTimeOrder },
      ),
    );
  }

  removeSlot(i: number): void {
    this.availabilitySlots.removeAt(i);
  }

  // Called when the Department dropdown changes. Narrows the Designation list
  // to the ones valid for that department and auto-fills a sensible default.
  onDepartmentChange(): void {
    this.refreshDesignationsForDepartment(true);
    this.onDesignationChange();
  }

  /**
   * Rebuilds the Designation options for the currently selected department.
   *
   * - Administration's ADMIN option is only offered when an OWNER is creating
   *   (admins can't create admins).
   * - When `autoFill` is true, the designation is set to the first valid option
   *   if the current value isn't valid for the chosen department. The control
   *   stays editable; for clinical departments (OPD/IPD) the user can still
   *   switch between Doctor and Nurse.
   */
  private refreshDesignationsForDepartment(autoFill: boolean): void {
    const dept = this.form.get('department')?.value as Department | '';

    if (!dept) {
      this.designations = [...STAFF_DESIGNATIONS];
      return;
    }

    let allowed: Designation[] = [
      ...(DEPARTMENT_DESIGNATIONS[dept] || STAFF_DESIGNATIONS),
    ];

    // Only an owner may create an ADMIN; drop it otherwise.
    if (!this.isOwner) {
      allowed = allowed.filter((d) => d !== 'ADMIN');
    }

    // Fallback so the dropdown is never empty (e.g. admin picks Administration).
    if (allowed.length === 0) {
      allowed = [...STAFF_DESIGNATIONS];
    }

    this.designations = allowed;

    if (autoFill) {
      const current = this.form.get('designation')?.value as Designation;
      if (!current || !allowed.includes(current)) {
        this.form.patchValue({ designation: allowed[0] });
      }
    }
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
      username: raw.username,
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
    // Route to the admin-creation endpoint whenever the target designation is
    // ADMIN — either the dedicated admin form (mode==='admin') or the owner
    // picking ADMIN in the normal employee form. The create-employee endpoint
    // rejects ADMIN/OWNER, so this must go to create-admin instead.
    const creatingAdmin = raw.designation === 'ADMIN';
    if (creatingAdmin) {
      // create-admin derives the admin designation/department server-side.
      payload.department = payload.department || 'Administration';
    }
    const call = creatingAdmin
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
            `${creatingAdmin ? 'Admin' : 'Employee'} created. Credentials sent via email.`,
        );
        this.router.navigate([
          creatingAdmin ? '/dashboard/admins' : '/dashboard/employees',
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