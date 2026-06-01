import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, Subject } from 'rxjs';
import { DashboardLayoutComponent } from '../../../shared/ui/dashboard-layout/dashboard-layout';
import { SearchableSelectComponent } from '../../../shared/ui/searchable-select/searchable-select';
import { SlotPickerComponent } from '../../../shared/ui/slot-picker/slot-picker';
import { PatientService } from '../../../core/services/patient.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { ToastService } from '../../../core/services/toast.service';
import { FormDraftService } from '../../../core/services/form-draft.service';
import { CanComponentDeactivate } from '../../../core/guards/unsaved-changes.guard';
import { Patient } from '../../../core/models/patient.model';
import {
  AvailabilitySlot,
  WeekDay,
} from '../../../core/models/employee.model';
import { DoctorOption } from '../../../core/models/appointment.model';
import {
  noPastDate,
  todayIsoDate,
} from '../../../core/validators/app-validators';

const DRAFT_KEY = 'draft:appointment-book';

// Slot length in minutes — kept consistent with the backend HH:mm-HH:mm format.
const SLOT_MINUTES = 30;

// JS Date.getDay() (0=Sunday) -> backend WeekDay enum.
const DAY_MAP: Record<number, WeekDay> = {
  0: 'SUNDAY',
  1: 'MONDAY',
  2: 'TUESDAY',
  3: 'WEDNESDAY',
  4: 'THURSDAY',
  5: 'FRIDAY',
  6: 'SATURDAY',
};

/**
 * Appointment booking (OWNER / ADMIN / RECEPTIONIST).
 *
 *   - Patient: searchable dropdown sourced from /patients/search (server-side)
 *   - Doctor: searchable dropdown sourced from /employees/doctors
 *   - Date: native date picker clamped to today+ (no past dates), with the
 *     no-past-date validator running on typed values too
 *   - Slots: derived from the doctor's availabilitySlots for the picked
 *     weekday, split into SLOT_MINUTES chunks; booked slots come from
 *     /appointments/booked-slots and render red + struck-through (handled by
 *     SlotPickerComponent).
 */
@Component({
  selector: 'app-appointment-book',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DashboardLayoutComponent,
    SearchableSelectComponent,
    SlotPickerComponent,
  ],
  templateUrl: './appointment-book.html',
  styleUrl: './appointment-book.css',
})
export class AppointmentBookComponent
  implements OnInit, CanComponentDeactivate {
  private readonly fb = inject(FormBuilder);
  private readonly patientService = inject(PatientService);
  private readonly employeeService = inject(EmployeeService);
  private readonly appointmentService = inject(AppointmentService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly formDraft = inject(FormDraftService);
  private readonly router = inject(Router);

  form: FormGroup = this.fb.group({
    patientId: ['', Validators.required],
    doctorEmployeeId: ['', Validators.required],
    appointmentDate: ['', [Validators.required, noPastDate]],
    timeSlot: ['', Validators.required],
  });

  // Rejects an appointment date earlier than the selected doctor's joining
  // date. Bound as an arrow fn so it can read doctorJoinIso(). Error:
  // { beforeJoining: true }
  private readonly beforeJoiningValidator = (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    const joinIso = this.doctorJoinIso();
    if (!value || !joinIso) {
      return null;
    }
    // yyyy-mm-dd strings compare correctly lexicographically.
    return String(value) < joinIso ? { beforeJoining: true } : null;
  };

  todayIso = todayIsoDate();
  loading = false;
  submittedOk = false;

  // Date-picker minimum: today, raised to the doctor's joining date when later.
  minDate = signal(this.todayIso);
  // The selected doctor's joining date as yyyy-mm-dd (null if none/unset).
  private readonly doctorJoinIso = signal<string | null>(null);
  // Friendly joining date for the error message (e.g. "Jun 25, 2026").
  doctorJoinDisplay = signal('');

  // Searchable options + display fields
  patients = signal<Patient[]>([]);
  doctors = signal<DoctorOption[]>([]);

  // Slot rendering
  availableSlots = signal<string[]>([]);
  bookedSlots = signal<string[]>([]);
  loadingSlots = signal(false);

  // Adapter properties so SearchableSelectComponent can read `label` /
  // `sublabel` keys regardless of the underlying object shape.
  patientOptions = signal<any[]>([]);
  doctorOptions = signal<any[]>([]);

  private readonly patientSearch$ = new Subject<string>();

  ngOnInit(): void {
    // Pre-load top doctors and a small patient page so the dropdowns aren't
    // empty before the user types.
    this.employeeService.getDoctors().subscribe({
      next: (res) => {
        const docs = res.doctors || [];
        this.doctors.set(docs);
        this.doctorOptions.set(
          docs.map((d) => ({
            value: d.employeeCode,
            label: d.name,
            sublabel: d.specialization || d.department || '',
          })),
        );
        // If a doctor was already selected (e.g. restored draft), resolve its
        // joining date now that the list is available.
        this.updateDoctorJoining();
        this.cdr.markForCheck();
      },
      error: () => this.toast.error('Failed to load doctors.'),
    });

    this.patientService.getPatients(1, 25).subscribe({
      next: (res) => {
        this.setPatientOptions(res.patients);
      },
      error: () => this.toast.error('Failed to load patients.'),
    });

    // Debounced server-side patient search.
    this.patientSearch$.pipe(debounceTime(300)).subscribe((term) => {
      if (!term || term.trim().length === 0) {
        this.patientService.getPatients(1, 25).subscribe({
          next: (res) => this.setPatientOptions(res.patients),
        });
        return;
      }
      this.patientService.searchPatients(term).subscribe({
        next: (res) => this.setPatientOptions(res.patients),
      });
    });

    // Attach the joining-date validator to the date control.
    this.form
      .get('appointmentDate')!
      .addValidators(this.beforeJoiningValidator);

    // Recompute slots whenever the doctor or date changes.
    this.form.get('doctorEmployeeId')!.valueChanges.subscribe(() => {
      this.updateDoctorJoining();
      this.refreshSlots();
    });
    this.form.get('appointmentDate')!.valueChanges.subscribe(() =>
      this.refreshSlots(),
    );

    // Draft restore + auto-save.
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

  private setPatientOptions(patients: Patient[]): void {
    this.patients.set(patients);
    this.patientOptions.set(
      patients.map((p) => ({
        value: p.UHID,
        label: p.name,
        sublabel: `${p.UHID} · ${p.phone}`,
      })),
    );
  }

  onPatientSearch = (term: string) => this.patientSearch$.next(term);

  // Updates the joining-date state (min date, display text, validity) for the
  // currently selected doctor.
  private updateDoctorJoining(): void {
    const doctorId = this.form.get('doctorEmployeeId')!.value;
    const doctor = this.doctors().find((d) => d.employeeCode === doctorId);
    const joiningRaw = doctor?.joiningDate;

    if (joiningRaw) {
      const joinDate = new Date(joiningRaw);
      const joinIso = this.toIso(joinDate);

      this.doctorJoinIso.set(joinIso);
      this.doctorJoinDisplay.set(
        joinDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
      );

      this.minDate.set(
        this.toIso(
          new Date(
            Math.max(
              new Date(joinIso).getTime(),
              new Date(this.todayIso).getTime(),
            ),
          ),
        ),
      );
    } else {
      this.doctorJoinIso.set(null);
      this.doctorJoinDisplay.set('');
      this.minDate.set(this.todayIso);
    }

    // Re-validate the date against the new doctor's joining date.
    this.form.get('appointmentDate')!.updateValueAndValidity();
  }

  // Formats a Date as yyyy-mm-dd in local time.
  private toIso(d: Date): string {
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  }

  private refreshSlots(): void {
    const doctorId = this.form.get('doctorEmployeeId')!.value;
    const date = this.form.get('appointmentDate')!.value;

    // Reset slot when inputs change.
    this.form.patchValue({ timeSlot: '' }, { emitEvent: false });
    this.availableSlots.set([]);
    this.bookedSlots.set([]);

    if (!doctorId || !date) {
      return;
    }

    // 1. Derive candidate slots from the doctor's availability for the weekday.
    const doctor = this.doctors().find((d) => d.employeeCode === doctorId);
    if (!doctor) {
      return;
    }
    const weekday = DAY_MAP[new Date(date).getDay()];
    const dayWindows = (doctor.availabilitySlots || []).filter(
      (w) => w.day === weekday,
    );
    const candidate = this.expandSlots(dayWindows);
    this.availableSlots.set(candidate);

    if (candidate.length === 0) {
      return;
    }

    // 2. Fetch currently booked slots for that doctor + date.
    this.loadingSlots.set(true);
    this.appointmentService.getBookedSlots(doctorId, date).subscribe({
      next: (res) => {
        this.bookedSlots.set(res.bookedSlots || []);
        this.loadingSlots.set(false);
      },
      error: () => {
        this.loadingSlots.set(false);
        this.bookedSlots.set([]);
      },
    });
  }

  // Expands availability windows (e.g. 09:00–17:00) into SLOT_MINUTES chunks
  // formatted as "HH:mm-HH:mm" exactly as the backend stores them.
  private expandSlots(windows: AvailabilitySlot[]): string[] {
    const out: string[] = [];
    for (const w of windows) {
      let cur = this.toMinutes(w.startTime);
      const end = this.toMinutes(w.endTime);
      while (cur + SLOT_MINUTES <= end) {
        const next = cur + SLOT_MINUTES;
        out.push(`${this.fmt(cur)}-${this.fmt(next)}`);
        cur = next;
      }
    }
    return out;
  }

  private toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private fmt(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty && !this.submittedOk;
  }

  // Selected doctor — used to show a fee summary.
  get selectedDoctor(): DoctorOption | null {
    const id = this.form.get('doctorEmployeeId')!.value;
    return this.doctors().find((d) => d.employeeCode === id) || null;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('Please fix the highlighted fields.');
      return;
    }

    this.loading = true;
    const payload = this.form.getRawValue();

    this.appointmentService.createAppointment(payload).subscribe({
      next: (res) => {
        this.loading = false;
        this.cdr.markForCheck();
        this.submittedOk = true;
        this.formDraft.clear(DRAFT_KEY);
        this.toast.success(res.message || 'Appointment booked.');
        this.router.navigate([
          '/dashboard/appointments',
          res.appointment.appointmentId,
        ]);
      },
      error: (err) => {
        this.loading = false;
        this.cdr.markForCheck();
        this.toast.error(err.error?.message || 'Failed to book appointment.');
        // Refresh slots in case a race produced the conflict.
        this.refreshSlots();
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/dashboard/appointments']);
  }
}