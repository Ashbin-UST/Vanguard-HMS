import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { DashboardLayoutComponent } from '../../../shared/ui/dashboard-layout/dashboard-layout';
import { PatientService } from '../../../core/services/patient.service';
import { ToastService } from '../../../core/services/toast.service';
import { FormDraftService } from '../../../core/services/form-draft.service';
import { CanComponentDeactivate } from '../../../core/guards/unsaved-changes.guard';
import { GENDERS } from '../../../core/models/patient.model';
import {
  phoneValidator,
  noFutureDate,
  notBlank,
  todayIsoDate,
} from '../../../core/validators/app-validators';

const DRAFT_KEY = 'draft:patient-create';

/**
 * Patient creation form (OWNER / ADMIN / RECEPTIONIST).
 *
 * The DOB field cannot be a future date — picker is clamped with [max] and the
 * validator runs on typed values too, showing the red error inline.
 */
@Component({
  selector: 'app-patient-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DashboardLayoutComponent],
  templateUrl: './patient-create.html',
  styleUrl: './patient-create.css',
})
export class PatientCreateComponent
  implements OnInit, CanComponentDeactivate
{
  private fb = inject(FormBuilder);
  private patientService = inject(PatientService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private formDraft = inject(FormDraftService);
  private router = inject(Router);

  genders = GENDERS;
  loading = false;
  submittedOk = false;
  todayIso = todayIsoDate();

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, notBlank]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, phoneValidator]],
    gender: ['', Validators.required],
    dob: ['', [Validators.required, noFutureDate]],
    status: ['ACTIVE', Validators.required],
    address: this.fb.group({
      houseName: ['', [Validators.required, notBlank]],
      houseNumber: ['', [Validators.required, notBlank]],
      city: ['', [Validators.required, notBlank]],
      postCode: ['', [Validators.required, notBlank]],
    }),
    emergencyContact: this.fb.group({
      contactName: ['', [Validators.required, notBlank]],
      relationship: ['', [Validators.required, notBlank]],
      contactNumber: ['', [Validators.required, phoneValidator]],
    }),
  });

  ngOnInit(): void {
    const draft = this.formDraft.get(DRAFT_KEY);
    if (draft) {
      this.form.patchValue(draft);
    }
    this.form.valueChanges.subscribe(() => {
      if (!this.submittedOk) {
        this.formDraft.save(DRAFT_KEY, this.form.getRawValue());
      }
    });
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

    this.loading = true;
    const raw = this.form.getRawValue();

    this.patientService.createPatient(raw).subscribe({
      next: (res) => {
        this.loading = false;
        this.cdr.markForCheck();
        this.submittedOk = true;
        this.formDraft.clear(DRAFT_KEY);
        this.toast.success(res.message || 'Patient created.');
        // Navigate to the new patient's detail page if UHID was returned.
        if (res.patient?.UHID) {
          this.router.navigate(['/dashboard/patients', res.patient.UHID]);
        } else {
          this.router.navigate(['/dashboard/patients']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.cdr.markForCheck();
        this.toast.error(err.error?.message || 'Failed to create patient.');
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/dashboard/patients']);
  }

  // Template helpers for nested form access.
  addressCtrl(name: string) {
    return this.form.get(['address', name]);
  }
  emergencyCtrl(name: string) {
    return this.form.get(['emergencyContact', name]);
  }
}
