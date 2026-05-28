import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DashboardLayoutComponent } from '../../../shared/ui/dashboard-layout/dashboard-layout';
import { AdminService } from '../../../core/services/admin.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { PatientService } from '../../../core/services/patient.service';
import { PendingApproval } from '../../../core/models/api-response.model';
import { ADMIN_SIDEBAR, ROLES, DEPARTMENTS } from '../../../core/models/user.model';
import { Appointment } from '../../../core/models/appointment.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DashboardLayoutComponent],
  templateUrl: './admin.html',
  styleUrl: './admin.scss'
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private appointmentService = inject(AppointmentService);
  private patientService = inject(PatientService);
  private router = inject(Router);

  sidebarItems = ADMIN_SIDEBAR;

  // Stats
  pendingCount = 0;
  todayAppointments: Appointment[] = [];
  totalPatients = 0;
  totalBookedToday = 0;
  totalCompletedToday = 0;

  loading = true;

  ngOnInit(): void {
    this.loadDashboardStats();
  }

  loadDashboardStats(): void {
    this.loading = true;

    // Load pending approvals count
    this.adminService.getPendingApprovals().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.pendingCount = response.data.length;
        }
      }
    });

    // Load today's appointments
    this.appointmentService.getTodayAppointments().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.todayAppointments = response.data;
          this.totalBookedToday = response.data.filter(a => a.status === 'BOOKED').length;
          this.totalCompletedToday = response.data.filter(a => a.status === 'COMPLETED').length;
        }
      }
    });

    // Load total patients
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