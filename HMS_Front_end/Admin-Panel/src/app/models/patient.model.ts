export interface Patient {
  _id?: string;
  UHID: string;
  name: string;
  phone: number;
  email: string;
  passwordHash?: string;
  gender: 'Male' | 'Female';
  dob: Date;
  address: Address;
  emergencyContact: EmergencyContact;
  status: 'ACTIVE' | 'INACTIVE';
  mustChangePassword: boolean;
  createdByEmployeeId?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Address {
  houseName: string;
  houseNumber: string;
  city: string;
  postCode: string;
}

export interface EmergencyContact {
  contactName: string;
  relationship: string;
  contactNumber: string;
}

export interface CreatePatientRequest {
  name: string;
  phone: number;
  email: string;
  gender: 'Male' | 'Female';
  dob: Date;
  address: Address;
  emergencyContact: EmergencyContact;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UpdatePatientRequest extends Partial<CreatePatientRequest> {}
