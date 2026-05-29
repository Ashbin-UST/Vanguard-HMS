import { AvailabilitySlot } from './employee.model';

/**
 * Appointment domain models — aligned with the backend Appointments schema.
 * The backend stores only: patientId, doctorEmployeeId, appointmentDate,
 * timeSlot, status. List/detail endpoints enrich each row with `patient`
 * and `doctor` display objects (see appointmentController.enrichAppointments).
 */

export type AppointmentStatus = 'BOOKED' | 'CANCELED' | 'COMPLETED';

export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'BOOKED',
  'CANCELED',
  'COMPLETED',
];

// Lightweight patient info attached to an enriched appointment.
export interface AppointmentPatientRef {
  UHID: string;
  name: string;
  phone: string;
  email: string;
}

// Lightweight doctor info attached to an enriched appointment.
export interface AppointmentDoctorRef {
  employeeCode: string;
  name: string;
  specialization?: string;
  department?: string;
  consultationFee?: number;
}

export interface Appointment {
  _id?: string;
  appointmentId: string;
  patientId: string;
  doctorEmployeeId: string;
  appointmentDate: string;
  timeSlot: string;
  status: AppointmentStatus;
  createdByEmployeeId?: string;
  // Present on list / detail responses (null if the referenced doc is gone).
  patient?: AppointmentPatientRef | null;
  doctor?: AppointmentDoctorRef | null;
}

// A doctor option for the booking dropdown (GET /employees/doctors).
export interface DoctorOption {
  _id?: string;
  employeeCode: string;
  name: string;
  specialization?: string;
  department?: string;
  consultationFee?: number;
  availabilitySlots?: AvailabilitySlot[];
  qualification?: string[];
}

// Payload to create an appointment.
export interface CreateAppointmentPayload {
  patientId: string;
  doctorEmployeeId: string;
  appointmentDate: string;
  timeSlot: string;
}

// GET /appointments (and /appointments/my) response.
export interface AppointmentsResponse {
  message: string;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  appointments: Appointment[];
}

// Single-appointment response.
export interface AppointmentResponse {
  message: string;
  appointment: Appointment;
}

// GET /employees/doctors response.
export interface DoctorsResponse {
  message: string;
  total: number;
  doctors: DoctorOption[];
}

// GET /appointments/booked-slots response.
export interface BookedSlotsResponse {
  message: string;
  doctorEmployeeId: string;
  date: string;
  bookedSlots: string[];
}
