export interface Patient {
  _id: string;
  UHID: string;
  name: string;
  phone: string;
  email: string;
  gender: Gender;
  dob: Date;
  age?: number;
  address?: {
    line1?: string;
    city?: string;
    postcode?: string;
  };
  emergencyContact?: {
    name?: string;
    phone?: string;
    relation?: string;
  };
  medicalHistory?: string;
  status: PatientStatus;
  registeredBy?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export type Gender = 'Male' | 'Female' | 'Other';
export type PatientStatus = 'ACTIVE' | 'INACTIVE';

export const GENDERS: Gender[] = ['Male', 'Female', 'Other'];