import { Component } from '@angular/core';
import { DashboardLayoutComponent } from '../../../../shared/ui/dashboard-layout/dashboard-layout';
import { EmployeeEditComponent } from '../../employees/employee-edit/employee-edit';
import { ADMIN_SIDEBAR } from '../../../../core/models/user.model';

@Component({
    selector: 'app-admin-employee-edit',
    standalone: true,
    imports: [DashboardLayoutComponent, EmployeeEditComponent],
    template: `
    <app-dashboard-layout
      [menuItems]="sidebarItems"
      title="HMS"
      subtitle="Admin Panel"
      pageTitle="Edit Employee"
    >
      <app-employee-edit></app-employee-edit>
    </app-dashboard-layout>
  `
})
export class AdminEmployeeEditComponent {
    sidebarItems = ADMIN_SIDEBAR;
}