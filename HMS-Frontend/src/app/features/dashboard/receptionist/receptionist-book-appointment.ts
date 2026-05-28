import { Component } from '@angular/core';
import { DashboardLayoutComponent } from '../../../shared/ui/dashboard-layout/dashboard-layout';
import { AppointmentCreateComponent } from '../../appointments/appointment-create/appointment-create';
import { RECEPTIONIST_SIDEBAR } from '../../../core/models/user.model';

@Component({ selector: 'app-receptionist-book-appointment', standalone: true, imports: [DashboardLayoutComponent, AppointmentCreateComponent],
  template: `<app-dashboard-layout [menuItems]="sidebarItems" title="HMS" subtitle="Reception" pageTitle="Book Appointment"><app-appointment-create></app-appointment-create></app-dashboard-layout>` })
export class ReceptionistBookAppointmentComponent { sidebarItems = RECEPTIONIST_SIDEBAR; }