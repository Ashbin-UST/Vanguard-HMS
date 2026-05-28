import { Component } from '@angular/core';
import { DashboardLayoutComponent } from '../../../../shared/ui/dashboard-layout/dashboard-layout';
import { EmployeeListComponent } from '../../employees/employee-list/employee-list';
import { ADMIN_SIDEBAR } from '../../../../core/models/user.model';

@Component({
  selector: 'app-admin-employee-list',
  standalone: true,
  imports: [DashboardLayoutComponent, EmployeeListComponent],
  template: `
    <app-dashboard-layout
      [menuItems]="sidebarItems"
      title="HMS"
      subtitle="Admin Panel"
      pageTitle="Employees"
    >
      <app-employee-list></app-employee-list>
    </app-dashboard-layout>
  `
})
export class AdminEmployeeListComponent {
  sidebarItems = ADMIN_SIDEBAR;
}