import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AppointmentService } from '../../../core/services/appointment.service';
import { AuthService } from '../../../core/services/auth.service';
import { Appointment } from '../../../core/models/appointment.model';

@Component({
  selector: 'app-doctor-notes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './doctor-notes.html',
  styleUrl: './doctor-notes.scss'
})
export class DoctorNotesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private appointmentService = inject(AppointmentService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  appointment: Appointment | null = null;
  notesForm!: FormGroup;
  loading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadAppointment(id);
  }

  loadAppointment(id: string): void {
    this.loading = true;
    this.appointmentService.getAppointmentById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.appointment = response.data;
          this.initForm();
        }
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  initForm(): void {
    this.notesForm = this.fb.group({
      diagnosis: [this.appointment?.diagnosis || ''],
      doctorNotes: [this.appointment?.doctorNotes || ''],
      prescription: [this.appointment?.prescription || '']
    });
  }

  onSubmit(): void {
    if (!this.appointment || !this.notesForm) return;

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.appointmentService.addDoctorNotes(this.appointment._id, this.notesForm.value).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'Notes saved successfully';
          setTimeout(() => {
            this.goBack();
          }, 1500);
        }
        this.saving = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to save notes';
        this.saving = false;
      }
    });
  }

  completeAndSave(): void {
    if (!this.appointment || !this.notesForm) return;

    this.saving = true;
    this.errorMessage = '';

    // Save notes first
    this.appointmentService.addDoctorNotes(this.appointment._id, this.notesForm.value).subscribe({
      next: () => {
        // Then mark as completed
        this.appointmentService.updateAppointmentStatus(this.appointment!._id, 'COMPLETED').subscribe({
          next: () => {
            this.successMessage = 'Notes saved and appointment completed!';
            setTimeout(() => this.goBack(), 1500);
            this.saving = false;
          },
          error: (error) => {
            this.errorMessage = error.error?.message || 'Failed to complete appointment';
            this.saving = false;
          }
        });
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to save notes';
        this.saving = false;
      }
    });
  }

  goBack(): void {
    const basePath = this.getBasePath();
    this.router.navigate([`${basePath}/appointments`]);
  }

  private getBasePath(): string {
    if (this.authService.hasRole(['ADMIN', 'OWNER'])) return '/admin';
    if (this.authService.hasRole(['DOCTOR'])) return '/doctor';
    return '/receptionist';
  }
}