import { Component, inject, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AppointmentService } from '../../../core/services/appointment.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmModalService } from '../../../core/services/confirm-modal.service';
import { Appointment, APPOINTMENT_STATUSES } from '../../../core/models/appointment.model';
import { DEPARTMENTS } from '../../../core/models/user.model';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './appointment-list.html',
  styleUrl: './appointment-list.scss'
})
export class AppointmentListComponent implements OnInit {
  private appointmentService = inject(AppointmentService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private confirmModal = inject(ConfirmModalService);

  @Input() showTodayOnly = false;
  @Input() doctorView = false;

  appointments: Appointment[] = [];
  loading = false;

  currentPage = 1;
  totalPages = 1;
  totalAppointments = 0;
  limit = 10;

  statusFilter = '';
  dateFilter = '';
  departmentFilter = '';

  activeTab: 'today' | 'upcoming' | 'completed' = 'today';

  statuses = APPOINTMENT_STATUSES;
  departments = DEPARTMENTS;

  ngOnInit(): void {
    if (this.showTodayOnly) {
      this.loadTodayAppointments();
    } else if (this.doctorView) {
      this.loadDoctorAppointments();
    } else {
      this.loadAppointments();
    }
  }

  loadAppointments(): void {
    this.loading = true;
    const filters: any = {};
    if (this.statusFilter) filters.status = this.statusFilter;
    if (this.dateFilter) filters.date = this.dateFilter;
    if (this.departmentFilter) filters.department = this.departmentFilter;

    this.appointmentService.getAllAppointments(
      this.currentPage, this.limit, filters
    ).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.appointments = response.data;
          this.totalAppointments = response.pagination?.total || 0;
          this.totalPages = response.pagination?.pages || 1;
        }
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  loadTodayAppointments(): void {
    this.loading = true;
    this.appointmentService.getTodayAppointments().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.appointments = response.data;
          this.totalAppointments = response.data.length;
        }
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  loadDoctorAppointments(): void {
    this.loading = true;
    const filters: any = {};

    if (this.activeTab === 'today') {
      filters.date = new Date().toISOString().split('T')[0];
      filters.status = 'BOOKED';
    } else if (this.activeTab === 'upcoming') {
      filters.status = 'BOOKED';
    } else if (this.activeTab === 'completed') {
      filters.status = 'COMPLETED';
    }

    this.appointmentService.getMyAppointments(
      this.currentPage, this.limit, filters
    ).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.appointments = response.data;
          this.totalAppointments = response.pagination?.total || 0;
          this.totalPages = response.pagination?.pages || 1;
        }
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  onTabChange(tab: 'today' | 'upcoming' | 'completed'): void {
    this.activeTab = tab;
    this.currentPage = 1;
    this.loadDoctorAppointments();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadAppointments();
  }

  clearFilters(): void {
    this.statusFilter = '';
    this.dateFilter = '';
    this.departmentFilter = '';
    this.currentPage = 1;
    this.loadAppointments();
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    if (this.doctorView) {
      this.loadDoctorAppointments();
    } else if (this.showTodayOnly) {
      this.loadTodayAppointments();
    } else {
      this.loadAppointments();
    }
  }

  viewAppointment(appointmentId: string): void {
    this.router.navigate([`${this.getBasePath()}/appointments`, appointmentId]);
  }

  bookAppointment(): void {
    this.router.navigate([`${this.getBasePath()}/book-appointment`]);
  }

  addNotes(appointmentId: string): void {
    this.router.navigate([`${this.getBasePath()}/appointments`, appointmentId, 'notes']);
  }

  //Clean async/await with modal
  async cancelAppointment(appointmentId: string): Promise<void> {
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
      appointmentId,
      result.inputValue?.trim() || 'No reason provided'
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Appointment cancelled successfully');
          this.refreshList();
        }
      },
      error: (error) => {
        this.toastService.error(
          error.error?.message || 'Failed to cancel appointment'
        );
      }
    });
  }

  // ✅ Clean async/await with modal
  async completeAppointment(appointmentId: string): Promise<void> {
    const result = await this.confirmModal.open({
      title: 'Complete Appointment',
      message: 'Mark this appointment as completed? This cannot be undone.',
      confirmText: 'Yes, Mark Complete',
      cancelText: 'Go Back',
      type: 'success'
    });

    if (!result.confirmed) return;

    this.appointmentService.updateAppointmentStatus(
      appointmentId, 'COMPLETED'
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Appointment marked as completed');
          this.refreshList();
        }
      },
      error: (error) => {
        this.toastService.error(
          error.error?.message || 'Failed to complete appointment'
        );
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'BOOKED': return 'status-booked';
      case 'COMPLETED': return 'status-completed';
      case 'CANCELLED': return 'status-cancelled';
      default: return '';
    }
  }

  isDoctor(): boolean {
    return this.authService.hasRole(['DOCTOR']);
  }

  canCancel(): boolean {
    return this.authService.hasRole(['RECEPTIONIST', 'ADMIN', 'OWNER']);
  }

  private refreshList(): void {
    if (this.doctorView) this.loadDoctorAppointments();
    else if (this.showTodayOnly) this.loadTodayAppointments();
    else this.loadAppointments();
  }

  private getBasePath(): string {
    if (this.authService.hasRole(['ADMIN', 'OWNER'])) return '/admin';
    if (this.authService.hasRole(['DOCTOR'])) return '/doctor';
    return '/receptionist';
  }
}