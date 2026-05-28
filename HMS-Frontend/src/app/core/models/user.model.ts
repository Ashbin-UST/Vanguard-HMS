export interface User {
  userId: string;
  email: string;
  roles: Role[];
  status: UserStatus;
  approvalStatus?: ApprovalStatus;
  employee?: Employee | null;
  lastLoginAt?: Date;
  createdAt?: Date;
}

export interface LoginResponse {
  userId: string;
  email: string;
  roles: Role[];
  status: UserStatus;
  employee: Employee | null;
  lastLoginAt: Date;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface Employee {
  _id?: string;
  employeeCode?: string;
  name: string;
  phone: string;
  email: string;
  department: Department;
  designation: string;
  specialization?: string;
  qualification?: string[];
  consultationFee?: number;
}

export type Role =
  | 'OWNER'
  | 'ADMIN'
  | 'DOCTOR'
  | 'RECEPTIONIST'
  | 'CASHIER'
  | 'NURSE'
  | 'LAB_TECH'
  | 'PHARMACIST';

export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type Department = 'OPD' | 'IPD' | 'Lab' | 'Pharmacy' | 'Admin';

export const ROLES: Role[] = [
  'DOCTOR',
  'NURSE',
  'RECEPTIONIST',
  'CASHIER',
  'LAB_TECH',
  'PHARMACIST',
];

export const DEPARTMENTS: Department[] = ['OPD', 'IPD', 'Lab', 'Pharmacy', 'Admin'];

// ADD these to your existing user.model.ts file

export interface SidebarItem {
  label: string;
  route: string;
  roles: Role[];
}


export const ADMIN_SIDEBAR: SidebarItem[] = [
  { label: 'Dashboard', route: '/admin/dashboard', roles: ['ADMIN', 'OWNER'] },
  { label: 'Employees', route: '/admin/employees', roles: ['ADMIN', 'OWNER'] },
  { label: 'Approvals', route: '/admin/approvals', roles: ['ADMIN', 'OWNER'] },

  //{ label: 'Create Employee', route: '/admin/create-employee', roles: ['ADMIN', 'OWNER'] },
  { label: 'Patients', route: '/admin/patients', roles: ['ADMIN', 'OWNER'] },
  { label: 'Appointments', route: '/admin/appointments', roles: ['ADMIN', 'OWNER'] },
  //{ label: 'Today\'s Appointments', route: '/admin/appointments/today', roles: ['ADMIN', 'OWNER'] },
  //{ label: 'Book Appointment', route: '/admin/book-appointment', roles: ['ADMIN', 'OWNER'] },
  //{ label: 'Profile', route: '/admin/profile', roles: ['ADMIN', 'OWNER'] },
];

export const RECEPTIONIST_SIDEBAR: SidebarItem[] = [
  { label: 'Dashboard', route: '/receptionist/dashboard', roles: ['RECEPTIONIST'] },
  { label: 'Patients', route: '/receptionist/patients', roles: ['RECEPTIONIST'] },
  //{ label: 'Search Patient', route: '/receptionist/patients/search', roles: ['RECEPTIONIST'] },
  { label: 'Appointments', route: '/receptionist/appointments', roles: ['RECEPTIONIST'] },
  //{ label: 'Today\'s Appointments', route: '/receptionist/appointments/today', roles: ['RECEPTIONIST'] },
  //{ label: 'Book Appointment', route: '/receptionist/book-appointment', roles: ['RECEPTIONIST'] },
  { label: 'Profile', route: '/receptionist/profile', roles: ['RECEPTIONIST'] },
];

export const DOCTOR_SIDEBAR: SidebarItem[] = [
  { label: 'Dashboard', route: '/doctor/dashboard', roles: ['DOCTOR'] },
  { label: 'My Appointments', route: '/doctor/appointments', roles: ['DOCTOR'] },
  { label: 'Profile', route: '/doctor/profile', roles: ['DOCTOR'] },
];