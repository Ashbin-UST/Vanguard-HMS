export interface Employee {
  _id: string;
  name: string;
  roles: string;          // User roles: OWNER | ADMIN | STAFF
  department: string;
  designation: string;    // DOCTOR | RECEPTIONIST | CASHIER | NURSE | LAB_TECH | PHARMACIST
  email: string;
  phone?: string;
  status: string;
  avatar: string;
  joiningDate: string;
  qualification?: string[];
  specialization?: string;
  medicalRegistrationNumber?: string;
  consultationFee?: number;
  availabilitySlots?: any[];
}
