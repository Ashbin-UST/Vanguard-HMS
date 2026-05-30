import {
  Component,
  forwardRef,
  Input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';

/**
 * Time-slot picker.
 *
 * Renders the provided list of slot strings (e.g. "10:00-10:30") as selectable
 * chips. Slots present in `bookedSlots` are shown in red with a strike-through
 * and are disabled/unselectable. Implements ControlValueAccessor so the chosen
 * slot binds to a form control. When an appointment is cancelled and the parent
 * re-fetches booked slots, the freed slot automatically becomes selectable.
 */
@Component({
  selector: 'app-slot-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './slot-picker.html',
  styleUrl: './slot-picker.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SlotPickerComponent),
      multi: true,
    },
  ],
})
export class SlotPickerComponent implements ControlValueAccessor {
  // All candidate slots for the selected doctor/day.
  @Input() set slots(value: string[]) {
    this._slots.set(value || []);
  }
  get slots(): string[] {
    return this._slots();
  }
  private readonly _slots = signal<string[]>([]);

  // Slots already booked (rendered red + struck through + disabled).
  @Input() set bookedSlots(value: string[]) {
    this._booked.set(new Set(value || []));
  }
  private readonly _booked = signal<Set<string>>(new Set());

  @Input() disabled = false;
  @Input() emptyText = 'Select a doctor and date to see available slots';

  selected = signal<string | null>(null);

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  // --- ControlValueAccessor ----------------------------------------------

  writeValue(value: any): void {
    this.selected.set(value ?? null);
  }
  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // --- Rendering helpers --------------------------------------------------

  isBooked(slot: string): boolean {
    return this._booked().has(slot);
  }

  isSelected(slot: string): boolean {
    return this.selected() === slot;
  }

  pick(slot: string): void {
    if (this.disabled || this.isBooked(slot)) {
      return;
    }
    // Toggle off if re-clicking the same slot.
    const next = this.selected() === slot ? null : slot;
    this.selected.set(next);
    this.onChange(next);
    this.onTouched();
  }

  trackBySlot = (_: number, slot: string) => slot;
}
