import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardLayoutComponent } from '../../../shared/ui/dashboard-layout/dashboard-layout';
import { AppointmentService } from '../../../core/services/appointment.service';
import { PatientService } from '../../../core/services/patient.service';
import { RECEPTIONIST_SIDEBAR } from '../../../core/models/user.model';
import { Appointment } from '../../../core/models/appointment.model';

@Component({
  selector: 'app-receptionist-dashboard',
  standalone: true,
  imports: [CommonModule, DashboardLayoutComponent],
  templateUrl: './receptionist.html',
  styleUrl: './receptionist.scss'
})
export class ReceptionistDashboardComponent implements OnInit {
  private appointmentService = inject(AppointmentService);
  private patientService = inject(PatientService);
  private router = inject(Router);

  sidebarItems = RECEPTIONIST_SIDEBAR;
  todayAppointments: Appointment[] = [];
  totalPatients = 0;
  totalBookedToday = 0;
  loading = true;

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;

    this.appointmentService.getTodayAppointments().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.todayAppointments = response.data;
          this.totalBookedToday = response.data.filter(a => a.status === 'BOOKED').length;
        }
      }
    });

    this.patientService.getAllPatients(1, 1).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.totalPatients = response.pagination?.total || 0;
        }
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}