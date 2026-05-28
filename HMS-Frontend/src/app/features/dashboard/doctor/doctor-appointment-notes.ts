import { Component } from '@angular/core';
import { DashboardLayoutComponent } from '../../../shared/ui/dashboard-layout/dashboard-layout';
import { DoctorNotesComponent } from '../../appointments/doctor-notes/doctor-notes';
import { DOCTOR_SIDEBAR } from '../../../core/models/user.model';

@Component({ selector: 'app-doctor-appointment-notes', standalone: true, imports: [DashboardLayoutComponent, DoctorNotesComponent],
  template: `<app-dashboard-layout [menuItems]="sidebarItems" title="HMS" subtitle="Doctor Panel" pageTitle="Add Notes"><app-doctor-notes></app-doctor-notes></app-dashboard-layout>` })
export class DoctorAppointmentNotesComponent { sidebarItems = DOCTOR_SIDEBAR; }