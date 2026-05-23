import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { Employee } from '../models/employee.model';
import { Activity } from '../models/activity.model';
import { Request } from '../models/request.model';
import { Toast } from '../models/toast.model';
import { NewEmployee } from '../models/newEmployee.model';
import { EmployeeTablesComponent } from '../employee-tables/employee-tables.component';
import {
  getAvatarColor, getRoleStyle, getRoleDotColor, makeAvatar
} from '../utils/dashboard.util';

interface EmployeeProfile {
  employeeCode: string;
  name: string;
  phone?: string;
  email: string;
  department: string;
  designation: string;
  joiningDate?: string;
  qualification?: string[];
  specialization?: string;
  medicalRegistrationNumber?: string;
  consultationFee?: number;
  availabilitySlots?: any[];
}

@Component({
  selector: 'app-dash',
  standalone: true,
  imports: [CommonModule, FormsModule, EmployeeTablesComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {

  // ── Constants ─────────────────────────────────────────────
  // Designations for filter dropdown
  designations = [
    'DOCTOR', 'RECEPTIONIST', 'CASHIER', 'NURSE', 'LAB_TECH', 'PHARMACIST'
  ];

  departments = [
    'OPD', 'IPD', 'Lab', 'Pharmacy', 'Administration', 'Reception', 'Billing'
  ];

  // Sidebar nav — initialized immediately so sidebar is never blank
  navItems: { id: string; label: string; icon: string }[] = [
    { id: 'overview',  label: 'Overview',  icon: '⊞' },
    { id: 'employees', label: 'Employees', icon: '👥' },
    { id: 'activity',  label: 'Activity',  icon: '📋' },
    { id: 'requests',  label: 'Requests',  icon: '🔔' },
  ];

  // ── State ─────────────────────────────────────────────────
  activeSection = 'overview';
  searchTerm = '';
  designationFilter = 'All';   // renamed: filters by designation not roles

  showAddModal = false;
  showDeleteConfirm: Employee | null = null;
  selectedEmployee: Employee | null = null;   // for employee detail popup
  expandedRequestId: string | null = null;    // for request detail popup
  selectedRequest: Request | null = null;     // for request detail popup

  toast: Toast | null = null;

  // FIX: Read from localStorage immediately so sidebar shows on first render
  // without waiting for the getProfile() HTTP call
  currentProfile: EmployeeProfile | null = this.loadProfileFromStorage();

  newEmp: NewEmployee = {
    name: '', role: 'DOCTOR', dept: 'OPD',
    email: '', designation: 'DOCTOR', status: 'Active'
  };

  // Only ACTIVE employees are shown everywhere
  employees: Employee[] = [];
  activities: Activity[] = [];
  requests: Request[] = [];

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.loadProfile();        // updates sidebar if profile changed
    this.loadSidebarNodes();
    this.loadEmployees();
    this.loadPendingRequests();
  }

  // ── Read profile from localStorage (instant, no HTTP) ────
  private loadProfileFromStorage(): EmployeeProfile | null {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return null;
      const user = JSON.parse(raw);
      // Login response stores: { username, email, roles, mustChangePassword, profile }
      if (user?.profile) {
        // Attach username onto the profile object for sidebar display
        return { ...user.profile, _username: user.username, _roles: user.roles };
      }
    } catch {}
    return null;
  }

  // Sidebar display helpers — use localStorage data immediately
  get sidebarAvatar(): string {
    return this.currentProfile ? makeAvatar((this.currentProfile as any).name) : '??';
  }
  get sidebarName(): string {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        return u.username || u.profile?.name || 'User';
      } catch {}
    }
    return this.currentProfile?.name ?? '??';
  }
  get sidebarRole(): string {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (u.roles?.length) return u.roles.join(', ');
      } catch {}
    }
    return this.currentProfile?.designation ?? '';
  }

  // ── Data Loaders ──────────────────────────────────────────

  loadProfile(): void {
    this.authService.getProfile().subscribe({
      next: (res: any) => {
        this.currentProfile = res.profile as EmployeeProfile;
      },
      error: (err) => console.error('Failed to load profile', err)
    });
  }

  loadSidebarNodes(): void {
    this.authService.getMyNodes().subscribe({
      next: (res: any) => {
        const nodes = res.nodes ?? [];
        if (nodes.length === 0) return;
        this.navItems = nodes.map((n: any) => ({
          id: n.path.replace(/^\//, ''),
          label: n.name,
          icon: n.icon || '📄'
        }));
        if (!this.navItems.some(i => i.id === 'requests')) {
          this.navItems.push({ id: 'requests', label: 'Requests', icon: '🔔' });
        }
      },
      error: () => {}   // defaults already visible
    });
  }

  // FIX: Only load ACTIVE employees — filter by status === 'ACTIVE'
  loadEmployees(): void {
    this.authService.getEmployees().subscribe({
      next: (res: any) => {
        this.employees = res.employees
          .filter((item: any) => item.status === 'ACTIVE')
          .map((item: any) => ({
            _id:                       item.employee.employeeCode,
            name:                      item.employee.name,
            roles:                     (item.roles ?? []).join(', '),   // OWNER/ADMIN/STAFF
            department:                item.employee.department,
            email:                     item.employee.email,
            phone:                     item.employee.phone || '',
            designation:               item.employee.designation,
            status:                    'Active',
            avatar:                    makeAvatar(item.employee.name),
            joiningDate:               item.employee.joiningDate
              ? new Date(item.employee.joiningDate).toISOString().split('T')[0]
              : '',
            qualification:             item.employee.qualification || [],
            specialization:            item.employee.specialization || '',
            medicalRegistrationNumber: item.employee.medicalRegistrationNumber || '',
            consultationFee:           item.employee.consultationFee ?? null,
            availabilitySlots:         item.employee.availabilitySlots || []
          }));
      },
      error: (err) => {
        console.error(err);
        this.showToast('Failed to load employees', 'error');
      }
    });
  }

  loadPendingRequests(): void {
    this.authService.getPendingEmployees().subscribe({
      next: (res: any) => {
        this.requests = res.employees.map((item: any) => ({
          _id:                       item.employee.employeeCode,
          name:                      item.employee.name || 'Unknown',
          role:                      item.employee.designation,
          designation:               item.employee.designation,
          department:                item.employee.department || 'N/A',
          email:                     item.employee.email,
          phone:                     item.employee.phone || '',
          joiningDate:               item.employee.joiningDate
            ? new Date(item.employee.joiningDate).toISOString().split('T')[0]
            : '',
          qualification:             item.employee.qualification || [],
          specialization:            item.employee.specialization || '',
          medicalRegistrationNumber: item.employee.medicalRegistrationNumber || '',
          consultationFee:           item.employee.consultationFee ?? null,
          avatar:                    makeAvatar(item.employee.name || 'U'),
          requestedBy:               'Self Registration',
          requestorRole:             'Employee',
          time:                      'Recently'
        }));
      },
      error: (err) => {
        console.error(err);
        this.showToast('Failed to load requests', 'error');
      }
    });
  }

  // ── Utility ───────────────────────────────────────────────
  getAvatarColor(name: string): string  { return getAvatarColor(name); }
  getRoleDotColor(role: string): string { return getRoleDotColor(role); }
  getRoleStyle(role: string): { [key: string]: string } { return getRoleStyle(role); }

  // ── Employee detail popup ─────────────────────────────────
  openEmployeeDetail(emp: Employee): void  { this.selectedEmployee = emp; }
  closeEmployeeDetail(): void              { this.selectedEmployee = null; }

  // ── Request detail popup ──────────────────────────────────
  openRequestDetail(req: Request): void   { this.selectedRequest = req; }
  closeRequestDetail(): void              { this.selectedRequest = null; }

  // ── Computed ──────────────────────────────────────────────
  get stats() {
    return {
      total:   this.employees.length,
      doctors: this.employees.filter(e => e.designation === 'DOCTOR').length,
      active:  this.employees.length,   // all loaded employees are ACTIVE
      pending: this.requests.length,
    };
  }

  get statsCards() {
    return [
      { label: 'Total Employees',  value: this.stats.total,   icon: '👥', color: '#6366f1', bg: '#ede9fe', action: 'employees' },
      { label: 'Doctors',          value: this.stats.doctors, icon: '🩺', color: '#0ea5e9', bg: '#e0f2fe', action: null },
      { label: 'Active Staff',     value: this.stats.active,  icon: '✅', color: '#10b981', bg: '#d1fae5', action: null },
      { label: 'Pending Requests', value: this.stats.pending, icon: '🔔', color: '#f59e0b', bg: '#fef3c7', action: 'requests' },
    ];
  }

  // FIX: designation filter for the dropdown in the employees section
  get filteredByDesignation(): Employee[] {
    return this.employees.filter(e => {
      const matchSearch = e.name.toLowerCase().includes(this.searchTerm.toLowerCase())
        || e.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchDes = this.designationFilter === 'All' || e.designation === this.designationFilter;
      return matchSearch && matchDes;
    });
  }

  get recentActivities(): Activity[] { return this.activities.slice(0, 4); }
  get requestsBadge(): number        { return this.requests.length; }

  get todayDate(): string {
    return new Date().toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  get pageTitle(): string {
    const map: Record<string, string> = {
      overview: 'Dashboard Overview', employees: 'Employees',
      activity: 'Recent Activity',    requests:  'Pending Requests',
    };
    return map[this.activeSection] || '';
  }

  get showAddButton(): boolean {
    return this.activeSection === 'overview' || this.activeSection === 'employees';
  }

  get recentEmployees(): Employee[] { return this.employees.slice(0, 5); }

  // ── Actions ───────────────────────────────────────────────
  setSection(id: string): void { this.activeSection = id; }

  // FIX: stat card click — navigate to section
  onStatCardClick(action: string | null): void {
    if (action) this.setSection(action);
  }

  showToast(msg: string, type: 'success' | 'error' = 'success'): void {
    this.toast = { msg, type };
    setTimeout(() => { this.toast = null; }, 3000);
  }

  addEmployee(): void {
    if (!this.newEmp.name || !this.newEmp.email) {
      this.showToast('Fill all required fields', 'error');
      return;
    }
    const payload = {
      name:        this.newEmp.name,
      email:       this.newEmp.email,
      designation: this.newEmp.designation || this.newEmp.role,
      department:  this.newEmp.dept,
      status:      'ACTIVE'
    };
    this.authService.createEmployee(payload).subscribe({
      next: (res: any) => {
        const created = res.employee ?? res;
        const emp: Employee = {
          _id:         created.employeeCode ?? String(Date.now()),
          name:        this.newEmp.name,
          roles:       'STAFF',
          department:  this.newEmp.dept,
          email:       this.newEmp.email,
          designation: this.newEmp.designation,
          status:      'Active',
          avatar:      makeAvatar(this.newEmp.name),
          joiningDate: new Date().toISOString().split('T')[0]
        };
        this.employees = [emp, ...this.employees];
        this.activities = [{
          _id: Date.now(), actor: this.sidebarName, actorRole: this.sidebarRole,
          action: 'added employee', target: `${emp.name} (${emp.designation})`,
          time: 'Just now', icon: '➕'
        }, ...this.activities];
        this.showAddModal = false;
        this.newEmp = { name: '', role: 'DOCTOR', dept: 'OPD', email: '', designation: 'DOCTOR', status: 'Active' };
        this.showToast(`${emp.name} added successfully`);
      },
      error: (err) => {
        console.error(err);
        this.showToast(err.error?.message || 'Failed to add employee', 'error');
      }
    });
  }

  confirmDelete(emp: Employee): void   { this.showDeleteConfirm = emp; this.selectedEmployee = null; }
  cancelDelete(): void                 { this.showDeleteConfirm = null; }

  deleteEmployee(emp: Employee): void {
    this.authService.deleteEmployee(String(emp._id)).subscribe({
      next: () => {
        this.employees = this.employees.filter(e => e._id !== emp._id);
        this.activities = [{
          _id: Date.now(), actor: this.sidebarName, actorRole: this.sidebarRole,
          action: 'removed employee', target: emp.name, time: 'Just now', icon: '🗑️'
        }, ...this.activities];
        this.showDeleteConfirm = null;
        this.showToast(`${emp.name} removed`, 'error');
      },
      error: (err) => {
        console.error(err);
        this.showDeleteConfirm = null;
        this.showToast(err.error?.message || 'Failed to delete employee', 'error');
      }
    });
  }

  approveRequest(req: Request): void {
    this.authService.approveEmployee(String(req._id)).subscribe({
      next: () => {
        this.requests = this.requests.filter(r => r._id !== req._id);
        this.selectedRequest = null;
        this.showToast(`${req.name} approved successfully`);
        this.loadEmployees();
      },
      error: (err) => {
        console.error(err);
        this.showToast('Approval failed', 'error');
      }
    });
  }

  rejectRequest(req: Request): void {
    this.authService.rejectEmployee(String(req._id)).subscribe({
      next: () => {
        this.requests = this.requests.filter(r => r._id !== req._id);
        this.selectedRequest = null;
        this.showToast(`${req.name} rejected`, 'error');
      },
      error: (err) => {
        console.error(err);
        this.showToast('Reject failed', 'error');
      }
    });
  }

  goToProfile(): void { this.router.navigate(['/profile']); }
}
