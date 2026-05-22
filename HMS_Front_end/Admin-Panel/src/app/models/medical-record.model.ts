export interface MedicalRecord {
  _id?: string;
  medicalRecordId: string;
  appointmentId: string;
  patientId: string;
  doctorEmployeeId: string;
  symptoms: string;
  diagnosis: string;
  prescriptionItems: PrescriptionItem[];
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
  patient?: {
    name: string;
    UHID: string;
    email: string;
  };
  doctor?: {
    name: string;
    employeeCode: string;
    specialization?: string;
  };
  appointment?: {
    appointmentDate: Date;
    status: string;
  };
}

export interface PrescriptionItem {
  name: string;
  dosage: string;
  duration: string;
}

export interface CreateMedicalRecordRequest {
  appointmentId: string;
  patientId: string;
  doctorEmployeeId: string;
  symptoms: string;
  diagnosis: string;
  prescriptionItems: PrescriptionItem[];
  notes?: string;
}

export interface UpdateMedicalRecordRequest extends Partial<CreateMedicalRecordRequest> {}
