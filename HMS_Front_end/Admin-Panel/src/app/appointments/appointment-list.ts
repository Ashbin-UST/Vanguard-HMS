import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AppointmentService } from '../services/appointment.service';
import { Appointment } from '../models/appointment.model';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, FormsModule],
  templateUrl: './appointment-list.html',
  styleUrl: './appointment-list.css',
})
export class AppointmentListComponent implements OnInit {
  appointments: Appointment[] = [];
  loading = false;
  error = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  searchQuery = '';
  filterStatus = '';

  statusOptions = ['BOOKED', 'CANCELED', 'COMPLETED'];

  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.loading = true;
    this.error = '';

    this.appointmentService.getAppointments(this.currentPage, this.itemsPerPage).subscribe({
      next: (response: any) => {
        let appointments = response.appointments || [];

        if (this.filterStatus) {
          appointments = appointments.filter(
            (a: Appointment) => a.status === this.filterStatus
          );
        }

        this.appointments = appointments;
        this.totalItems = response.total || 0;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Failed to load appointments';
        this.loading = false;
      },
    });
  }

  filterByStatus(): void {
    this.currentPage = 1;
    this.loadAppointments();
  }

  viewAppointment(id: string): void {
    this.router.navigate(['/appointments', id]);
  }

  editAppointment(id: string): void {
    this.router.navigate(['/appointments/edit', id]);
  }

  cancelAppointment(id: string): void {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      this.appointmentService.cancelAppointment(id).subscribe({
        next: () => {
          this.loadAppointments();
          alert('Appointment cancelled successfully');
        },
        error: (err: any) => {
          alert(err.error?.message || 'Failed to cancel appointment');
        },
      });
    }
  }

  createNewAppointment(): void {
    this.router.navigate(['/appointments/create']);
  }

  nextPage(): void {
    if (this.currentPage * this.itemsPerPage < this.totalItems) {
      this.currentPage++;
      this.loadAppointments();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadAppointments();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'BOOKED':
        return 'status-booked';
      case 'COMPLETED':
        return 'status-completed';
      case 'CANCELED':
        return 'status-canceled';
      default:
        return '';
    }
  }
}
