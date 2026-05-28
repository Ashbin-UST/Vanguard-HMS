import { Component } from '@angular/core';
import { DashboardLayoutComponent } from '../../../shared/ui/dashboard-layout/dashboard-layout';
import { ProfileComponent } from '../../profile/profile';
import { DOCTOR_SIDEBAR } from '../../../core/models/user.model';

@Component({
  selector: 'app-doctor-profile',
  standalone: true,
  imports: [DashboardLayoutComponent, ProfileComponent],
  template: `
    <app-dashboard-layout [menuItems]="sidebarItems" title="HMS" subtitle="Doctor Panel" pageTitle="My Profile">
      <app-profile></app-profile>
    </app-dashboard-layout>
  `
})
export class DoctorProfileComponent {
  sidebarItems = DOCTOR_SIDEBAR;
}