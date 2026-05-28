import { Component } from '@angular/core';
import { DashboardLayoutComponent } from '../../../../shared/ui/dashboard-layout/dashboard-layout';
import { DoctorNotesComponent } from '../../../appointments/doctor-notes/doctor-notes';
import { ADMIN_SIDEBAR } from '../../../../core/models/user.model';

@Component({
  selector: 'app-admin-appointment-notes',
  standalone: true,
  imports: [DashboardLayoutComponent, DoctorNotesComponent],
  template: `
    <app-dashboard-layout [menuItems]="sidebarItems" title="HMS" subtitle="Admin Panel" pageTitle="Doctor Notes">
      <app-doctor-notes></app-doctor-notes>
    </app-dashboard-layout>
  `
})
export class AdminAppointmentNotesComponent {
  sidebarItems = ADMIN_SIDEBAR;
}