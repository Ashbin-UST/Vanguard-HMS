import { Component } from '@angular/core';
import { DashboardLayoutComponent } from '../../../../shared/ui/dashboard-layout/dashboard-layout';
import { AppointmentCreateComponent } from '../../../appointments/appointment-create/appointment-create';
import { ADMIN_SIDEBAR } from '../../../../core/models/user.model';

@Component({
  selector: 'app-admin-book-appointment',
  standalone: true,
  imports: [DashboardLayoutComponent, AppointmentCreateComponent],
  template: `
    <app-dashboard-layout [menuItems]="sidebarItems" title="HMS" subtitle="Admin Panel" pageTitle="Book Appointment">
      <app-appointment-create></app-appointment-create>
    </app-dashboard-layout>
  `
})
export class AdminBookAppointmentComponent {
  sidebarItems = ADMIN_SIDEBAR;
}