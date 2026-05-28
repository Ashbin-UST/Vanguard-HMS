import { Component } from '@angular/core';
import { DashboardLayoutComponent } from '../../../shared/ui/dashboard-layout/dashboard-layout';
import { AppointmentListComponent } from '../../appointments/appointment-list/appointment-list';
import { RECEPTIONIST_SIDEBAR } from '../../../core/models/user.model';

@Component({ selector: 'app-receptionist-appointments-today', standalone: true, imports: [DashboardLayoutComponent, AppointmentListComponent],
  template: `<app-dashboard-layout [menuItems]="sidebarItems" title="HMS" subtitle="Reception" pageTitle="Today's Appointments"><app-appointment-list [showTodayOnly]="true"></app-appointment-list></app-dashboard-layout>` })
export class ReceptionistAppointmentsTodayComponent { sidebarItems = RECEPTIONIST_SIDEBAR; }