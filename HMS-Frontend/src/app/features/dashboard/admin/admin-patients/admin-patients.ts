import { Component } from '@angular/core';
import { DashboardLayoutComponent } from '../../../../shared/ui/dashboard-layout/dashboard-layout';
import { PatientListComponent } from '../../../patients/patient-list/patient-list';
import { ADMIN_SIDEBAR } from '../../../../core/models/user.model';

@Component({
  selector: 'app-admin-patients',
  standalone: true,
  imports: [DashboardLayoutComponent, PatientListComponent],
  template: `
    <app-dashboard-layout [menuItems]="sidebarItems" title="HMS" subtitle="Admin Panel" pageTitle="Patients">
      <app-patient-list></app-patient-list>
    </app-dashboard-layout>
  `
})
export class AdminPatientsComponent {
  sidebarItems = ADMIN_SIDEBAR;
}