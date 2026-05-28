import { Component } from '@angular/core';
import { DashboardLayoutComponent } from '../../../shared/ui/dashboard-layout/dashboard-layout';
import { AppointmentListComponent } from '../../appointments/appointment-list/appointment-list';
import { DOCTOR_SIDEBAR } from '../../../core/models/user.model';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [DashboardLayoutComponent, AppointmentListComponent],
  templateUrl: './doctor.html',
  styleUrl: './doctor.scss'
})
export class DoctorDashboardComponent {
  sidebarItems = DOCTOR_SIDEBAR;
}