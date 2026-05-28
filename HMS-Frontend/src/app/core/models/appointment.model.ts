export interface Appointment {
  _id: string;
  appointmentId: string;
  patientId: any;
  doctorEmployeeId: any;
  date: Date;
  timeSlot: string;
  department: string;
  appointmentType: AppointmentType;
  reasonForVisit: string;
  consultationFee: number;
  status: AppointmentStatus;
  doctorNotes?: string;
  diagnosis?: string;
  prescription?: string;
  createdByEmployeeId?: any;
  cancelledBy?: any;
  cancellationReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AvailableDoctor {
  _id: string;
  employeeCode: string;
  name: string;
  specialization: string;
  department: string;
  consultationFee: number;
  availabilitySlots: string[];
  qualification?: string[];
}

export interface AvailableSlots {
  doctorName: string;
  date: Date;
  availableSlots: string[];
  bookedSlots: string[];
  totalSlots: number;
}

export type AppointmentStatus = 'BOOKED' | 'CANCELLED' | 'COMPLETED';
export type AppointmentType = 'Consultation' | 'Follow-up' | 'Emergency' | 'Check-up';

export const APPOINTMENT_TYPES: AppointmentType[] = ['Consultation', 'Follow-up', 'Emergency', 'Check-up'];
export const APPOINTMENT_STATUSES: AppointmentStatus[] = ['BOOKED', 'CANCELLED', 'COMPLETED'];