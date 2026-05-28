import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AppointmentService } from '../../../core/services/appointment.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmModalService } from '../../../core/services/confirm-modal.service';
import { Appointment } from '../../../core/models/appointment.model';

@Component({
  selector: 'app-appointment-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './appointment-detail.html',
  styleUrl: './appointment-detail.scss'
})
export class AppointmentDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private appointmentService = inject(AppointmentService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private confirmModal = inject(ConfirmModalService);

  appointment: Appointment | null = null;
  loading = true;

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
        }
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  // ✅ Replaced confirm + alert with modal + toast
  async completeAppointment(): Promise<void> {
    if (!this.appointment) return;

    const result = await this.confirmModal.open({
      title: 'Complete Appointment',
      message: 'Mark this appointment as completed? This cannot be undone.',
      confirmText: 'Yes, Mark Complete',
      cancelText: 'Go Back',
      type: 'success'
    });

    if (!result.confirmed) return;

    this.appointmentService.updateAppointmentStatus(
      this.appointment._id, 'COMPLETED'
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Appointment marked as completed');
          this.loadAppointment(this.appointment!._id);
        }
      },
      error: (error) => {
        this.toastService.error(
          error.error?.message || 'Failed to complete appointment'
        );
      }
    });
  }

  // ✅ Replaced prompt + alert with modal (with input) + toast
  async cancelAppointment(): Promise<void> {
    if (!this.appointment) return;

    const result = await this.confirmModal.open({
      title: 'Cancel Appointment',
      message: 'Are you sure you want to cancel this appointment?',
      confirmText: 'Yes, Cancel It',
      cancelText: 'Go Back',
      type: 'danger',
      showInput: true,
      inputLabel: 'Reason for cancellation (optional)',
      inputPlaceholder: 'e.g. Patient requested reschedule...'
    });

    if (!result.confirmed) return;

    this.appointmentService.cancelAppointment(
      this.appointment._id,
      result.inputValue?.trim() || 'No reason provided'
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Appointment cancelled successfully');
          this.loadAppointment(this.appointment!._id);
        }
      },
      error: (error) => {
        this.toastService.error(
          error.error?.message || 'Failed to cancel appointment'
        );
      }
    });
  }

  addNotes(): void {
    this.router.navigate([
      `${this.getBasePath()}/appointments`,
      this.appointment?._id,
      'notes'
    ]);
  }

  goBack(): void {
    this.router.navigate([`${this.getBasePath()}/appointments`]);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'BOOKED':    return 'status-booked';
      case 'COMPLETED': return 'status-completed';
      case 'CANCELLED': return 'status-cancelled';
      default:          return '';
    }
  }

  isDoctor(): boolean   { return this.authService.hasRole(['DOCTOR']); }
  canCancel(): boolean  { return this.authService.hasRole(['RECEPTIONIST', 'ADMIN', 'OWNER']); }
  canAddNotes(): boolean { return this.authService.hasRole(['DOCTOR', 'ADMIN', 'OWNER']); }

  private getBasePath(): string {
    if (this.authService.hasRole(['ADMIN', 'OWNER'])) return '/admin';
    if (this.authService.hasRole(['DOCTOR']))          return '/doctor';
    return '/receptionist';
  }
}