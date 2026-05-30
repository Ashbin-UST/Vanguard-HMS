import {
  Component,
  forwardRef,
  Input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Password input with a built-in show/hide (eye) toggle.
 *
 * Implements ControlValueAccessor so it drops straight into reactive forms via
 * formControlName, exactly like a native <input>. The toggle flips the field
 * between type="password" and type="text" so users can verify what they typed.
 *
 * Deliberately used ONLY for primary password fields (login password, new
 * password, current password). Confirm-password fields intentionally do NOT
 * use this — the user must retype the password blind to confirm it.
 */
@Component({
  selector: 'app-password-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './password-input.html',
  styleUrl: './password-input.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PasswordInputComponent),
      multi: true,
    },
  ],
})
export class PasswordInputComponent implements ControlValueAccessor {
  @Input() placeholder = '';
  @Input() autocomplete = 'current-password';
  @Input() inputId?: string;

  value = signal('');
  visible = signal(false);
  disabled = signal(false);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  // --- ControlValueAccessor ---
  writeValue(value: string): void {
    this.value.set(value ?? '');
  }
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  onInput(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.value.set(v);
    this.onChange(v);
  }

  onBlur(): void {
    this.onTouched();
  }

  toggleVisibility(): void {
    this.visible.update((v) => !v);
  }
}