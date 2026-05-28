import { Component } from '@angular/core';
import { DashboardLayoutComponent } from '../../../shared/ui/dashboard-layout/dashboard-layout';
import { AppointmentListComponent } from '../../appointments/appointment-list/appointment-list';
import { RECEPTIONIST_SIDEBAR } from '../../../core/models/user.model';

@Component({ selector: 'app-receptionist-appointments', standalone: true, imports: [DashboardLayoutComponent, AppointmentListComponent],
  template: `<app-dashboard-layout [menuItems]="sidebarItems" title="HMS" subtitle="Reception" pageTitle="All Appointments"><app-appointment-list></app-appointment-list></app-dashboard-layout>` })
export class ReceptionistAppointmentsComponent { sidebarItems = RECEPTIONIST_SIDEBAR; }