import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Employee } from '../models/employee.model';
import { CommonModule } from '@angular/common';
import { avatarColors } from '../utils/dashboard.util';

const designationColors: Record<string, { bg: string; text: string; dot: string }> = {
  DOCTOR:        { bg: '#e8f5e9', text: '#2e7d32', dot: '#43a047' },
  RECEPTIONIST:  { bg: '#e3f2fd', text: '#1565c0', dot: '#1e88e5' },
  CASHIER:       { bg: '#fff8e1', text: '#f57f17', dot: '#ffa000' },
  NURSE:         { bg: '#fce4ec', text: '#880e4f', dot: '#e91e63' },
  LAB_TECH:      { bg: '#ede7f6', text: '#4527a0', dot: '#7e57c2' },
  PHARMACIST:    { bg: '#e0f7fa', text: '#006064', dot: '#00acc1' },
};

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
  @Input() designationFilter: string = 'All';   // FIX: was roleFilter, now designationFilter
  @Output() requestDelete = new EventEmitter<Employee>();
  @Output() openDetail = new EventEmitter<Employee>();   // NEW: open detail popup

  // FIX: filter by designation, not roles
  get filteredEmployees(): Employee[] {
    return this.employees.filter(e => {
      const term = this.searchTerm.toLowerCase();
      const matchSearch = e.name.toLowerCase().includes(term)
        || e.email.toLowerCase().includes(term);
      const matchDes = this.designationFilter === 'All'
        || e.designation === this.designationFilter;
      return matchSearch && matchDes;
    });
  }

  getAvatarColor(name: string): string {
    if (!name?.trim()) return avatarColors[0];
    return avatarColors[name.trim().charCodeAt(0) % avatarColors.length];
  }

  getDesignationStyle(designation: string): { [key: string]: string } {
    const c = designationColors[designation] || { bg: '#f3f4f6', text: '#374151', dot: '#9ca3af' };
    return { background: c.bg, color: c.text };
  }

  getDesignationDot(designation: string): string {
    return (designationColors[designation] || { dot: '#9ca3af' }).dot;
  }

  confirmDelete(emp: Employee): void { this.requestDelete.emit(emp); }
  onRowClick(emp: Employee): void    { this.openDetail.emit(emp); }
}
