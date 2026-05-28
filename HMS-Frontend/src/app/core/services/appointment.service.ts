import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Appointment, AvailableDoctor, AvailableSlots } from '../models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/appointments`;

  // --- Appointment CRUD ---

  createAppointment(data: any): Observable<ApiResponse<Appointment>> {
    return this.http.post<ApiResponse<Appointment>>(this.apiUrl, data);
  }

  getAllAppointments(page: number = 1, limit: number = 10, filters?: any): Observable<ApiResponse<Appointment[]>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.date) params = params.set('date', filters.date);
    if (filters?.department) params = params.set('department', filters.department);
    if (filters?.doctorId) params = params.set('doctorId', filters.doctorId);

    return this.http.get<ApiResponse<Appointment[]>>(this.apiUrl, { params });
  }

  getAppointmentById(id: string): Observable<ApiResponse<Appointment>> {
    return this.http.get<ApiResponse<Appointment>>(`${this.apiUrl}/${id}`);
  }

  getMyAppointments(page: number = 1, limit: number = 10, filters?: any): Observable<ApiResponse<Appointment[]>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.date) params = params.set('date', filters.date);

    return this.http.get<ApiResponse<Appointment[]>>(`${this.apiUrl}/my`, { params });
  }

  getDoctorAppointments(doctorId: string, page: number = 1, limit: number = 10, filters?: any): Observable<ApiResponse<Appointment[]>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.date) params = params.set('date', filters.date);

    return this.http.get<ApiResponse<Appointment[]>>(`${this.apiUrl}/doctor/${doctorId}`, { params });
  }

  getPatientAppointments(patientId: string): Observable<ApiResponse<Appointment[]>> {
    return this.http.get<ApiResponse<Appointment[]>>(`${this.apiUrl}/patient/${patientId}`);
  }

  getTodayAppointments(): Observable<ApiResponse<Appointment[]>> {
    return this.http.get<ApiResponse<Appointment[]>>(`${this.apiUrl}/today`);
  }

  // --- Status & Notes ---

  updateAppointmentStatus(id: string, status: string): Observable<ApiResponse<Appointment>> {
    return this.http.put<ApiResponse<Appointment>>(`${this.apiUrl}/${id}/status`, { status });
  }

  addDoctorNotes(id: string, data: { doctorNotes?: string; diagnosis?: string; prescription?: string }): Observable<ApiResponse<Appointment>> {
    return this.http.put<ApiResponse<Appointment>>(`${this.apiUrl}/${id}/notes`, data);
  }

  cancelAppointment(id: string, cancellationReason?: string): Observable<ApiResponse<Appointment>> {
    return this.http.put<ApiResponse<Appointment>>(`${this.apiUrl}/${id}/cancel`, { cancellationReason });
  }

  deleteAppointment(id: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${id}`);
  }

  // --- Doctor Availability ---

  getAvailableDoctors(filters?: { specialization?: string; department?: string }): Observable<ApiResponse<AvailableDoctor[]>> {
    let params = new HttpParams();
    if (filters?.specialization) params = params.set('specialization', filters.specialization);
    if (filters?.department) params = params.set('department', filters.department);

    return this.http.get<ApiResponse<AvailableDoctor[]>>(`${this.apiUrl}/doctors/available`, { params });
  }

  getAvailableSlots(doctorId: string, date: string): Observable<ApiResponse<AvailableSlots>> {
    const params = new HttpParams().set('date', date);
    return this.http.get<ApiResponse<AvailableSlots>>(`${this.apiUrl}/doctors/${doctorId}/slots`, { params });
  }
}