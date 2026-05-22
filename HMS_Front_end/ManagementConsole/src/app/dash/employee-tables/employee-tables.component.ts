import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Employee } from '../models/employee.model';
import { CommonModule } from '@angular/common';

import {
  getAvatarColor,
  getRoleStyle,
  getRoleDotColor,
  avatarColors,
  roleColors,

} from '../utils/dashboard.util';

@Component({
  selector: 'app-employee-tables',
  
standalone: true,
  imports: [CommonModule],

  templateUrl: './employee-tables.component.html',
  styleUrls: ['./employee-tables.component.css']
})
export class EmployeeTablesComponent {
  @Input() employees: Employee[] = [];
  @Input() searchTerm: string = '';
  @Input() roleFilter: string = 'All';
  @Output() remove = new EventEmitter<Employee>();

@Output() requestDelete = new EventEmitter<Employee>();

  showDeleteConfirm: Employee | null = null;


  get filteredEmployees(): Employee[] {
    return this.employees.filter(e => {
      const matchSearch = e.name.toLowerCase().includes(this.searchTerm.toLowerCase())
        || e.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchRole = this.roleFilter === 'All' || e.roles === this.roleFilter;
      return matchSearch && matchRole;
    });
  }

  getAvatarColor(name: string): string {
    return avatarColors[name.charCodeAt(0) % avatarColors.length];
  }

  getRoleStyle(role: string): { [key: string]: string } {
    const c = roleColors[role] || { bg: '#f3f4f6', text: '#374151', dot: '#9ca3af' };
    return { background: c.bg, color: c.text };
  }

  getRoleDotColor(role: string): string {
    return (roleColors[role] || { dot: '#9ca3af' }).dot;
  }

  confirmDelete(emp: Employee): void {
this.requestDelete.emit(emp);
  }

  delete(emp: Employee): void {
    this.remove.emit(emp);
    this.showDeleteConfirm = null;
  }
}
