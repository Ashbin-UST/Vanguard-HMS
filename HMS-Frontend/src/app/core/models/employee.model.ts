export interface Employee {
  _id?: string;
  employeeCode?: string;
  name: string;
  phone: string;
  email: string;
  department: Department;
  designation: string;
  status?: EmployeeStatus;
  joiningDate?: Date;
  medicalRegistrationNo?: string;
  specialization?: string;
  qualification?: string[];
  consultationFee?: number;
  availabilitySlots?: string[];
}

export type Department = 'OPD' | 'IPD' | 'Lab' | 'Pharmacy' | 'Admin';
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE';

export const DEPARTMENTS: Department[] = ['OPD', 'IPD', 'Lab', 'Pharmacy', 'Admin'];
