import { Component } from '@angular/core';
import { DashboardLayoutComponent } from '../../../shared/ui/dashboard-layout/dashboard-layout';
import { PatientListComponent } from '../../patients/patient-list/patient-list';
import { RECEPTIONIST_SIDEBAR } from '../../../core/models/user.model';

@Component({ selector: 'app-receptionist-patients', standalone: true, imports: [DashboardLayoutComponent, PatientListComponent],
  template: `<app-dashboard-layout [menuItems]="sidebarItems" title="HMS" subtitle="Reception" pageTitle="Patients"><app-patient-list></app-patient-list></app-dashboard-layout>` })
export class ReceptionistPatientsComponent { sidebarItems = RECEPTIONIST_SIDEBAR; }