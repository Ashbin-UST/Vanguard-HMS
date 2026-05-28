import { Component } from '@angular/core';
import { DashboardLayoutComponent } from '../../../shared/ui/dashboard-layout/dashboard-layout';
import { PatientCreateComponent } from '../../patients/patient-create/patient-create';
import { RECEPTIONIST_SIDEBAR } from '../../../core/models/user.model';

@Component({ selector: 'app-receptionist-patient-create', standalone: true, imports: [DashboardLayoutComponent, PatientCreateComponent],
  template: `<app-dashboard-layout [menuItems]="sidebarItems" title="HMS" subtitle="Reception" pageTitle="Register Patient"><app-patient-create></app-patient-create></app-dashboard-layout>` })
export class ReceptionistPatientCreateComponent { sidebarItems = RECEPTIONIST_SIDEBAR; }