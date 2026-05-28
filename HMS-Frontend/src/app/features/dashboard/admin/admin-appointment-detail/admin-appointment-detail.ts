import { Component } from '@angular/core';
import { DashboardLayoutComponent } from '../../../../shared/ui/dashboard-layout/dashboard-layout';
import { AppointmentDetailComponent } from '../../../appointments/appointment-detail/appointment-detail';
import { ADMIN_SIDEBAR } from '../../../../core/models/user.model';

@Component({
  selector: 'app-admin-appointment-detail',
  standalone: true,
  imports: [DashboardLayoutComponent, AppointmentDetailComponent],
  template: `
    <app-dashboard-layout [menuItems]="sidebarItems" title="HMS" subtitle="Admin Panel" pageTitle="Appointment Details">
      <app-appointment-detail></app-appointment-detail>
    </app-dashboard-layout>
  `
})
export class AdminAppointmentDetailComponent {
  sidebarItems = ADMIN_SIDEBAR;
}