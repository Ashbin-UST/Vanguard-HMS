import { Component } from '@angular/core';
import { DashboardLayoutComponent } from '../../../../shared/ui/dashboard-layout/dashboard-layout';
import { PatientDetailComponent } from '../../../patients/patient-detail/patient-detail';
import { ADMIN_SIDEBAR } from '../../../../core/models/user.model';

@Component({
  selector: 'app-admin-patient-detail',
  standalone: true,
  imports: [DashboardLayoutComponent, PatientDetailComponent],
  template: `
    <app-dashboard-layout [menuItems]="sidebarItems" title="HMS" subtitle="Admin Panel" pageTitle="Patient Details">
      <app-patient-detail></app-patient-detail>
    </app-dashboard-layout>
  `
})
export class AdminPatientDetailComponent {
  sidebarItems = ADMIN_SIDEBAR;
}