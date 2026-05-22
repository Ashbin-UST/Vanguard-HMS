import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Employee } from './models/employee.model';
import { Activity } from './models/activity.model';
import { Request } from './models/request.model';
import { NavItem } from './models/navItem.model';
import { Toast } from './models/toast.model';
import { NewEmployee } from './models/newEmployee.model';
import { EmployeeTablesComponent } from './employee-tables/employee-tables.component';

import { ActivityComponent } from '../dash/activity/activity.component';

import { EmployeeService } from '../service/dashboard/employee/employee.service';
import { AuditService } from '../service/dashboard/audit/audit.service';
import { NavnodeService } from '../service/dashboard/navnode/navnode.service';
import {
  getAvatarColor,
  getRoleStyle,
  getRoleDotColor,
  makeAvatar,
  getActivityIcon,
  getTimeAgo,
  formatAction

} from './utils/dashboard.util';

@Component({
  selector: 'app-dash',
  standalone: true,
  imports: [CommonModule, FormsModule, EmployeeTablesComponent, ActivityComponent],
  templateUrl: './dash.component.html',
  styleUrls: ['./dash.component.css']
})

export class DashComponent {

  // ── Constants ───────────────────────────────────────────────────
  roles = ["Admin",'Doctor', 'Cashier', 'Receptionist', 'Nurse', 'Lab Technician', 'Pharmacist'];
  departments = ['Cardiology', 'General', 'Pediatrics', 'Emergency', 'Radiology', 'Pharmacy', 'Finance', 'Front Desk'];


navItems: NavItem[] = [];

  // ── State ────────────────────────────────────────────────────────
  activeSection = 'overview';
  searchTerm    = '';
  roleFilter    = 'All';
  showAddModal  = false;
  showDeleteConfirm: Employee | null = null;
  toast: Toast | null = null;

  newEmp: NewEmployee = { name: '', role: 'Doctor', dept: 'General', email: '', designation: '', status: 'Active' };

  employees: Employee[] = [];

  activities: Activity[] = [
    // { _id: 1, actor: 'Priya Sharma',    actorRole: 'Receptionist', action: 'added employee',           target: 'Kavya Nair (Nurse)',           time: '2 mins ago', icon: '➕' },
    // { _id: 2, actor: 'Dr. Arjun Mehta', actorRole: 'Doctor',       action: 'updated profile of',       target: 'Amit Joshi',                  time: '18 mins ago', icon: '✏️' },
    // { _id: 3, actor: 'Rahul Verma',     actorRole: 'Cashier',      action: 'requested removal of',     target: 'Dr. Sneha Iyer',              time: '1 hr ago',   icon: '🗑️' },
    // { _id: 4, actor: 'Priya Sharma',    actorRole: 'Receptionist', action: 'submitted a new hire request for', target: 'Ravi Kumar (Pharmacist)', time: '3 hrs ago', icon: '📋' },
    // { _id: 5, actor: 'Dr. Sneha Iyer',  actorRole: 'Doctor',       action: 'marked leave for',         target: 'Kavya Nair',                  time: '5 hrs ago',  icon: '📅' },
  ];

  requests: Request[] = [
    // { _id: 1, requestedBy: 'Priya Sharma',    requestorRole: 'Receptionist', name: 'Ravi Kumar',  role: 'Pharmacist',     dept: 'Pharmacy',   email: 'ravi.k@hospital.com',  time: '3 hrs ago',  avatar: 'RK' },
    // { _id: 2, requestedBy: 'Dr. Arjun Mehta', requestorRole: 'Doctor',       name: 'Divya Pillai', role: 'Nurse',         dept: 'Cardiology', email: 'divya.p@hospital.com', time: 'Yesterday',  avatar: 'DP' },
    // { _id: 3, requestedBy: 'Rahul Verma',     requestorRole: 'Cashier',      name: 'Suresh Babu', role: 'Lab Technician', dept: 'Radiology',  email: 'suresh.b@hospital.com', time: '2 days ago', avatar: 'SB' },
  ];

  constructor(private router: Router, private employeeService: EmployeeService, private auditService: AuditService, private navnodeService: NavnodeService) {}

  ngOnInit(): void {
    this.loadEmployees();
    this.loadActivities();
    this.loadNavItems();
  }
  
loadNavItems() {
  const role = localStorage.getItem('role') || "ADMIN";

  this.navnodeService.getNavByRole(role).subscribe({
    next: (data) => {
      this.navItems = data;
      // alert(JSON.stringify(data));
      if (data.length) {
        this.activeSection = data[0].url;
      }
    },
    error: () => {
      this.showToast('Failed to load navigation', 'error');
    }
  });
}

loadActivities(): void {
  this.auditService.getAuditLogs().subscribe({
    next: (logs: any[]) => {

      this.activities = logs.map(log => ({
        _id: log._id,

        actor: log.actor,
        actorRole: log.actorRole,

        action: formatAction(log.action),

        target: `${log.collectionName} (${log.targetUserId})`,

        time: getTimeAgo(log.createdAt),

        icon: getActivityIcon(log.action)
      }));
    },
    error: (err) => {
      console.error(err);
      this.showToast('Failed to load activities', 'error');
    }
  });
}
  
loadEmployees(): void {
  this.employeeService.getEmployees().subscribe({
    next: (data) => {
      console.log('Employees loaded:', data);
      this.employees = data;
    },
    error: (err) => {
      console.error('Failed to load employees', err);
      this.showToast('Failed to load employees', 'error');
    }
  });
}


getAvatarColor(name: string): string {
  return getAvatarColor(name);
}

  
getRoleDotColor(role: string): string {
  return getRoleDotColor(role);
}

getRoleStyle(role: string): { [key: string]: string } {
  return getRoleStyle(role);
}



  // ── Computed ──────────────────────────────────────────────────────
  get stats() {
    return {
      total:   this.employees.length,
      doctors: this.employees.filter(e => e.roles === 'Doctor').length,
      active:  this.employees.filter(e => e.status === 'Active').length,
      pending: this.requests.length,
    };
  }

  get statsCards() {
    return [
      { label: 'Total Employees',   value: this.stats.total,   icon: '👥', color: '#6366f1', bg: '#ede9fe' },
      { label: 'Doctors',           value: this.stats.doctors, icon: '🩺', color: '#0ea5e9', bg: '#e0f2fe' },
      { label: 'Active Staff',      value: this.stats.active,  icon: '✅', color: '#10b981', bg: '#d1fae5' },
      { label: 'Pending Requests',  value: this.stats.pending, icon: '🔔', color: '#f59e0b', bg: '#fef3c7' },
    ];
  }

 
  get recentActivities(): Activity[] {
    return this.activities.slice(0, 4);
  }

  get requestsBadge(): number {
    return this.requests.length;
  }

  get todayDate(): string {
    return new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  get pageTitle(): string {
    const map: Record<string, string> = {
      overview:  'Dashboard Overview',
      employees: 'Employees',
      activity:  'Recent Activity',
      requests:  'Pending Requests',
    };
    return map[this.activeSection] || '';
  }

  get showAddButton(): boolean {
    return this.activeSection === 'overview' || this.activeSection === 'employees';
  }

  // ── Actions ───────────────────────────────────────────────────────
  setSection(id: string): void {
    this.activeSection = id;
  }

  showToast(msg: string, type: 'success' | 'error' = 'success'): void {
    this.toast = { msg, type };
    setTimeout(() => (this.toast = null), 3000);
  }

addEmployee(): void {
  if (!this.newEmp.name || !this.newEmp.email) {
    this.showToast('Fill all required fields', 'error');
    return;
  }

  const emp: Employee = {
    _id: Date.now(),
    name: this.newEmp.name,
    roles: this.newEmp.role,
    department: this.newEmp.dept,
    email: this.newEmp.email,
    designation: this.newEmp.designation,
    status: this.newEmp.status,
    avatar: makeAvatar(this.newEmp.name),
    joiningDate: new Date().toISOString().split('T')[0]
  };

  this.employeeService.addEmployee(emp).subscribe({
    next: (savedEmp) => {
      this.employees = [savedEmp, ...this.employees];

      this.activities = [{
        _id: Date.now(),
        actor: 'Admin',
        actorRole: 'Admin',
        action: 'added employee',
        target: `${savedEmp.name} (${savedEmp.roles})`,
        time: 'Just now',
        icon: '➕'
      }, ...this.activities];

      this.showAddModal = false;

      this.newEmp = {
        name: '',
        role: 'Doctor',
        dept: 'General',
        email: '',
        designation: '',
        status: 'Active'
      };

      this.showToast(`${savedEmp.name} added successfully`);
    },
    error: (err) => {
      console.error('Failed to add employee', err);
      this.showToast('Failed to add employee', 'error');
    }
  });
}


  cancelDelete(): void {
    this.showDeleteConfirm = null;
  }
  
  
confirmDelete(emp: Employee): void {
  this.showDeleteConfirm = emp;
}

  
get recentEmployees(): Employee[] {
  return this.employees.slice(0, 5);
}

  deleteEmployee(emp: Employee): void {
  this.employeeService.deleteEmployee(emp._id).subscribe({
    next: () => {
      this.employees = this.employees.filter(e => e._id !== emp._id);

      this.activities = [{
        _id: Date.now(),
        actor: 'Admin',
        actorRole: 'Admin',
        action: 'removed employee',
        target: emp.name,
        time: 'Just now',
        icon: '🗑️'
      }, ...this.activities];

      this.showDeleteConfirm = null;
      this.showToast(`${emp.name} removed`, 'error');
    },
    error: (err) => {
      console.error('Failed to delete employee', err);
      this.showToast('Failed to delete employee', 'error');
    }
  });
}

  approveRequest(req: Request): void {
    const emp: Employee = {
      _id:     Date.now(),
      name:   req.name, roles: req.role, department: req.department,
      email:  req.email, status: 'Active', designation: req.designation,
      avatar: makeAvatar(req.name),
      // show date in dd/mm/yyyy format
      joiningDate: new Date().toISOString().split('T')[0],
    };
    alert(JSON.stringify(emp));
    this.employees  = [emp, ...this.employees];
    this.requests   = this.requests.filter(r => r._id !== req._id);
    this.activities = [{
      _id: Date.now(), actor: 'Admin', actorRole: 'Admin',
      action: 'approved and added', target: `${req.name} (${req.role})`,
      time: 'Just now', icon: '✅',
    }, ...this.activities];
    this.showToast(`${req.name} approved & added`);
  }

  rejectRequest(req: Request): void {
    this.requests   = this.requests.filter(r => r._id !== req._id);
    this.activities = [{
      _id: Date.now(), actor: 'Admin', actorRole: 'Admin',
      action: 'rejected request for', target: req.name,
      time: 'Just now', icon: '❌',
    }, ...this.activities];
    this.showToast(`Request for ${req.name} rejected`, 'error');
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }
}
