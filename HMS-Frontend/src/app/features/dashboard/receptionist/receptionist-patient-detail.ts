import { Component } from '@angular/core';
import { DashboardLayoutComponent } from '../../../shared/ui/dashboard-layout/dashboard-layout';
import { PatientDetailComponent } from '../../patients/patient-detail/patient-detail';
import { RECEPTIONIST_SIDEBAR } from '../../../core/models/user.model';

@Component({ selector: 'app-receptionist-patient-detail', standalone: true, imports: [DashboardLayoutComponent, PatientDetailComponent],
  template: `<app-dashboard-layout [menuItems]="sidebarItems" title="HMS" subtitle="Reception" pageTitle="Patient Details"><app-patient-detail></app-patient-detail></app-dashboard-layout>` })
export class ReceptionistPatientDetailComponent { sidebarItems = RECEPTIONIST_SIDEBAR; }