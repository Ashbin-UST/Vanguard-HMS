import {
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
  FormGroup,
} from '@angular/forms';

/**
 * Reusable, backend-aligned form validators for fail-fast client validation.
 *
 * Each validator mirrors a backend rule so the frontend never sends a value the
 * backend would reject. They attach a specific error key so templates can show
 * a precise red message under the field.
 */

// --- Shared patterns (kept identical to the backend) ---------------------

// An optional country code (+ then 1-3 digits) followed by a single space,
// then exactly 10 digits — OR a bare 10-digit number.
// Accepts: "+91 1234567890", "+1 9876543210", "1234567890"
// Rejects: "+919876543210" (no space), "+91 987654321" (9 digits),
//          "+91 98765432101" (11 digits), "+91-9876543210" (wrong separator),
//          "+91 98765 43210" (inner space), "+9123 1234567890" (4-digit code)
export const PHONE_PATTERN = /^(\+\d{1,3} )?\d{10}$/;

// At least one lowercase, one uppercase, one digit, one special char.
export const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

// Appointment time slot in HH:mm-HH:mm form (matches backend route regex).
export const TIME_SLOT_PATTERN =
  /^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$/;

// --- Date helpers ---------------------------------------------------------

// Today's date at local midnight (time component stripped) for date-only compares.
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// Parses a control value (Date or ISO/yyyy-mm-dd string) to a local-midnight Date.
function toDateOnly(value: unknown): Date | null {
  if (!value) {
    return null;
  }
  let d: Date;
  if (value instanceof Date) {
    d = new Date(value);
  } else if (typeof value === 'string' || typeof value === 'number') {
    d = new Date(value);
  } else {
    // Anything else (objects, etc.) can't be a meaningful date.
    return null;
  }
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  d.setHours(0, 0, 0, 0);
  return d;
}

// Returns today's date as yyyy-mm-dd (for binding to <input type="date" [max]/[min]>).
export function todayIsoDate(): string {
  const d = startOfToday();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

// --- Date validators ------------------------------------------------------

/**
 * Disallows a future date (today allowed). Used for patient date of birth.
 * Error: { futureDate: true }
 */
export const noFutureDate: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const date = toDateOnly(control.value);
  if (!date) {
    return null; // 'required' handles emptiness; invalid strings ignored here
  }
  return date.getTime() > startOfToday().getTime()
    ? { futureDate: true }
    : null;
};

/**
 * Disallows a past date (today allowed). Used for appointment date.
 * Error: { pastDate: true }
 */
export const noPastDate: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const date = toDateOnly(control.value);
  if (!date) {
    return null;
  }
  return date.getTime() < startOfToday().getTime() ? { pastDate: true } : null;
};

// --- Field validators -----------------------------------------------------

// Phone must match the country-code + 10-digit pattern. Error: { phone: true }
export const phoneValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = (control.value ?? '').toString().trim();
  if (!value) {
    return null;
  }
  return PHONE_PATTERN.test(value) ? null : { phone: true };
};

// Strong password. Error: { weakPassword: true }
export const passwordValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = (control.value ?? '').toString();
  if (!value) {
    return null;
  }
  if (value.length < 8 || !PASSWORD_PATTERN.test(value)) {
    return { weakPassword: true };
  }
  return null;
};

/**
 * Granular password CHARACTER-CLASS complexity validator. Returns a specific
 * key for EACH unmet character requirement so the template can list every
 * missing rule at once:
 *   { uppercase?, lowercase?, number?, special? }
 *
 * NOTE: minimum length is intentionally NOT checked here. Length is validated
 * separately with the built-in Validators.minLength(8) so its error can be
 * shown live (before submit), while these character-class errors are gated to
 * appear only after the submit button is clicked.
 *
 * Returns null when all character rules pass (or the value is empty —
 * 'required' handles emptiness).
 */
export const passwordComplexity: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = (control.value ?? '').toString();
  if (!value) {
    return null;
  }

  const errors: ValidationErrors = {};
  if (!/[A-Z]/.test(value)) {
    errors['uppercase'] = true;
  }
  if (!/[a-z]/.test(value)) {
    errors['lowercase'] = true;
  }
  if (!/\d/.test(value)) {
    errors['number'] = true;
  }
  if (!/[^A-Za-z0-9]/.test(value)) {
    errors['special'] = true;
  }

  return Object.keys(errors).length ? errors : null;
};

/**
 * Cross-field "must differ" validator (apply at the FormGroup level). Flags the
 * group when `newKey` equals `otherKey` (e.g. new password equals current).
 * Error on the group: { sameAsCurrent: true }
 */
export function notSameAs(
  newKey: string,
  otherKey: string,
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const fg = group as FormGroup;
    const newVal = fg.get(newKey)?.value;
    const otherVal = fg.get(otherKey)?.value;
    if (newVal && otherVal && newVal === otherVal) {
      return { sameAsCurrent: true };
    }
    return null;
  };
}

// Time slot format. Error: { timeSlot: true }
export const timeSlotValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = (control.value ?? '').toString().trim();
  if (!value) {
    return null;
  }
  return TIME_SLOT_PATTERN.test(value) ? null : { timeSlot: true };
};

// Converts an "HH:mm" string to minutes since midnight, or null if invalid.
function timeToMinutes(value: unknown): number | null {
  if (typeof value !== 'string') {
    return null;
  }
  const m = /^(\d{2}):(\d{2})$/.exec(value.trim());
  if (!m) {
    return null;
  }
  return Number(m[1]) * 60 + Number(m[2]);
}

/**
 * Availability-slot time-order validator (apply at the slot FormGroup level).
 * Ensures startTime is strictly before endTime. Error on the group:
 * { slotTimeOrder: true }
 */
export const slotTimeOrder: ValidatorFn = (
  group: AbstractControl,
): ValidationErrors | null => {
  const start = timeToMinutes(group.get('startTime')?.value);
  const end = timeToMinutes(group.get('endTime')?.value);
  if (start === null || end === null) {
    return null;
  }
  return start < end ? null : { slotTimeOrder: true };
};

/**
 * Cross-field password match validator (apply at the FormGroup level).
 * Reads `passwordKey` and `confirmKey` controls. Error on the group:
 * { passwordMismatch: true }
 */
export function passwordMatchValidator(
  passwordKey = 'password',
  confirmKey = 'confirmPassword',
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const fg = group as FormGroup;
    const password = fg.get(passwordKey)?.value;
    const confirm = fg.get(confirmKey)?.value;
    if (password && confirm && password !== confirm) {
      return { passwordMismatch: true };
    }
    return null;
  };
}

/**
 * Trims and rejects whitespace-only values (stronger than Validators.required
 * for text fields). Error: { required: true } to reuse standard messaging.
 */
export const notBlank: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  if (control.value == null) {
    return null;
  }
  return control.value.toString().trim().length === 0
    ? { required: true }
    : null;
};

// Non-negative number (e.g. consultation fee). Error: { negative: true }
export const nonNegative: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  if (
    control.value === null ||
    control.value === '' ||
    control.value === undefined
  ) {
    return null;
  }
  const num = Number(control.value);
  if (Number.isNaN(num)) {
    return { number: true };
  }
  return num < 0 ? { negative: true } : null;
};