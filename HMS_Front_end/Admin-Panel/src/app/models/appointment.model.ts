export interface Appointment {
  _id?: string;
  appointmentId: string;
  patientId: string;
  doctorEmployeeId: string;
  appointmentDate: Date;
  timeSlot: string;
  status: 'BOOKED' | 'CANCELED' | 'COMPLETED';
  createdByEmployeeId?: string;
  created_at?: Date;
  updated_at?: Date;
  patient?: {
    name: string;
    UHID: string;
    email: string;
    phone: number;
  };
  doctor?: {
    name: string;
    employeeCode: string;
    email: string;
    specialization?: string;
  };
}

export interface CreateAppointmentRequest {
  patientId: string;
  doctorEmployeeId: string;
  appointmentDate: Date;
  timeSlot: string;
}

export interface UpdateAppointmentRequest {
  status: 'BOOKED' | 'CANCELED' | 'COMPLETED';
  appointmentDate?: Date;
  timeSlot?: string;
}

export interface AppointmentSlot {
  day: string;
  startTime: string;
  endTime: string;
}
