import { apiFetch } from "./apiClient";
import type { Appointment, AppointmentStatus, Doctor } from "./types";

type AppointmentsResponse = {
  message: string;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  appointments: Appointment[];
};

type DoctorsResponse = { message: string; total: number; doctors: Doctor[] };
type BookedSlotsResponse = { message: string; bookedSlots: string[] };
type AppointmentResponse = { message: string; appointment: Appointment };

export function getMyAppointments(status?: AppointmentStatus) {
  const query = status ? `?status=${status}&limit=100` : "?limit=100";
  return apiFetch<AppointmentsResponse>(`/patient/appointments${query}`);
}

export function getDoctors() {
  return apiFetch<DoctorsResponse>("/patient/doctors");
}

export function getBookedSlots(doctorEmployeeId: string, date: string) {
  return apiFetch<BookedSlotsResponse>(
    `/patient/booked-slots?doctorEmployeeId=${encodeURIComponent(
      doctorEmployeeId,
    )}&date=${encodeURIComponent(date)}`,
  );
}

export function bookAppointment(
  doctorEmployeeId: string,
  appointmentDate: string,
  timeSlot: string,
) {
  return apiFetch<AppointmentResponse>("/patient/appointments", {
    method: "POST",
    body: { doctorEmployeeId, appointmentDate, timeSlot },
  });
}

export function updateAppointment(
  appointmentId: string,
  doctorEmployeeId: string,
  appointmentDate: string,
  timeSlot: string,
) {
  return apiFetch<AppointmentResponse>(`/patient/appointments/${appointmentId}`, {
    method: "PUT",
    body: { doctorEmployeeId, appointmentDate, timeSlot },
  });
}

export function cancelAppointment(
  appointmentId: string,
  cancellationReason: string,
) {
  return apiFetch<AppointmentResponse>(
    `/patient/appointments/${appointmentId}/cancel`,
    {
      method: "PUT",
      body: { cancellationReason },
    },
  );
}
