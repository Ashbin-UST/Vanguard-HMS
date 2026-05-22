export interface User {
  _id?: string;
  username: string;
  email: string;
  passwordHash?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'REJECTED';
  roles: ('OWNER' | 'ADMIN' | 'STAFF')[];
  employeeCode: string;
  mustChangePassword: boolean;
  createdByAdmin: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  createdBy?: string;
  resetPasswordTokenHash?: string;
  resetPasswordTokenExpiry?: Date;
  lastLoginAt?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  profile?: any;
  employee?: Employee;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface Employee {
  _id?: string;
  employeeCode: string;
  name: string;
  phone: string;
  email: string;
  department: 'OPD' | 'IPD' | 'Lab' | 'Pharmacy' | 'Administration' | 'Reception' | 'Billing';
  designation: 'OWNER' | 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'CASHIER' | 'NURSE' | 'LAB_TECH' | 'PHARMACIST';
  joiningDate: Date;
  medicalRegistrationNumber?: string;
  specialization?: string;
  qualification: string[];
  consultationFee?: number;
  availabilitySlots?: AvailabilitySlot[];
  created_at?: Date;
  updated_at?: Date;
}

export interface AvailabilitySlot {
  day: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  startTime: string;
  endTime: string;
}
