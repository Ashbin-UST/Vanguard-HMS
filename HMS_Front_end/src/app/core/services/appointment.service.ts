import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AppointmentResponse,
  AppointmentsResponse,
  BookedSlotsResponse,
  CreateAppointmentPayload,
} from '../models/appointment.model';

export interface AppointmentFilters {
  status?: string;
  date?: string;
  doctorEmployeeId?: string;
  patientId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/appointments`;

  createAppointment(
    data: CreateAppointmentPayload,
  ): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(
      `${this.apiUrl}/create-appointment`,
      data,
    );
  }

  getAppointments(
    page = 1,
    limit = 10,
    filters?: AppointmentFilters,
  ): Observable<AppointmentsResponse> {
    let params = this.buildListParams(page, limit, filters);
    return this.http.get<AppointmentsResponse>(this.apiUrl, { params });
  }

  // Doctor's own appointments.
  getMyAppointments(
    page = 1,
    limit = 100,
    filters?: AppointmentFilters,
  ): Observable<AppointmentsResponse> {
    let params = this.buildListParams(page, limit, filters);
    return this.http.get<AppointmentsResponse>(`${this.apiUrl}/my`, {
      params,
    });
  }

  getAppointmentById(appointmentId: string): Observable<AppointmentResponse> {
    return this.http.get<AppointmentResponse>(
      `${this.apiUrl}/${appointmentId}`,
    );
  }

  // Booked slots for a doctor on a date (for slot-conflict rendering).
  getBookedSlots(
    doctorEmployeeId: string,
    date: string,
  ): Observable<BookedSlotsResponse> {
    const params = new HttpParams()
      .set('doctorEmployeeId', doctorEmployeeId)
      .set('date', date);
    return this.http.get<BookedSlotsResponse>(`${this.apiUrl}/booked-slots`, {
      params,
    });
  }

  cancelAppointment(appointmentId: string): Observable<AppointmentResponse> {
    return this.http.put<AppointmentResponse>(
      `${this.apiUrl}/${appointmentId}/cancel`,
      {},
    );
  }

  completeAppointment(appointmentId: string): Observable<AppointmentResponse> {
    return this.http.put<AppointmentResponse>(
      `${this.apiUrl}/${appointmentId}/complete`,
      {},
    );
  }

  private buildListParams(
    page: number,
    limit: number,
    filters?: AppointmentFilters,
  ): HttpParams {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.date) {
      params = params.set('date', filters.date);
    }
    if (filters?.doctorEmployeeId) {
      params = params.set('doctorEmployeeId', filters.doctorEmployeeId);
    }
    if (filters?.patientId) {
      params = params.set('patientId', filters.patientId);
    }
    return params;
  }
}
