// Designations are the real roles in this system (stored on the employee).
export type Designation =
  | 'OWNER'
  | 'ADMIN'
  | 'DOCTOR'
  | 'RECEPTIONIST'
  | 'CASHIER'
  | 'NURSE'
  | 'LAB_TECH'
  | 'PHARMACIST';

// Departments exactly match the backend enum.
export type Department =
  | 'OPD'
  | 'IPD'
  | 'Lab'
  | 'Pharmacy'
  | 'Administration'
  | 'Reception'
  | 'Billing';

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'REJECTED';

export type UserRole = 'OWNER' | 'ADMIN' | 'STAFF';

export type WeekDay =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

// A single availability window for a doctor.
export interface AvailabilitySlot {
  day: WeekDay;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

//Employee profile
export interface EmployeeProfile {
  employeeCode: string;
  name: string;
  phone: string;
  email: string;
  department: Department;
  designation: Designation;
  joiningDate?: string;
  qualification?: string[];
  // medical staff (DOCTOR, NURSE, LAB_TECH, PHARMACIST)
  medicalRegistrationNumber?: string;
  // DOCTOR + LAB_TECH
  specialization?: string;
  // DOCTOR only
  consultationFee?: number;
  availabilitySlots?: AvailabilitySlot[];
}
export interface EmployeeListItem {
  employee: EmployeeProfile;
  status: EmployeeStatus;
  roles: UserRole[];
  lastLoginAt?: string | null;
}

// Payload to create an employee (admin) / admin (owner).
export interface CreateEmployeePayload {
  username: string;
  name: string;
  phone: string;
  email: string;
  department: Department;
  designation: Designation;
  joiningDate: string;
  qualification: string[];
  medicalRegistrationNumber?: string;
  specialization?: string;
  consultationFee?: number;
  availabilitySlots?: AvailabilitySlot[];
}

export const DEPARTMENTS: Department[] = [
  'OPD',
  'IPD',
  'Lab',
  'Pharmacy',
  'Administration',
  'Reception',
  'Billing',
];

// Designations a user may self-register / be created as (never OWNER/ADMIN here).
export const STAFF_DESIGNATIONS: Designation[] = [
  'DOCTOR',
  'RECEPTIONIST',
  'CASHIER',
  'NURSE',
  'LAB_TECH',
  'PHARMACIST',
];

export const WEEK_DAYS: WeekDay[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

// Designations that require a medical registration number.
export const MEDICAL_DESIGNATIONS: Designation[] = [
  'DOCTOR',
  'NURSE',
  'LAB_TECH',
  'PHARMACIST',
];

// Designations that carry a specialization.
export const SPECIALIZATION_DESIGNATIONS: Designation[] = [
  'DOCTOR',
  'LAB_TECH',
];
