import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Appointment, CreateAppointmentRequest, UpdateAppointmentRequest } from '../models/appointment.model';

@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  private readonly apiUrl = 'http://localhost:5000/api/appointments';

  constructor(private readonly http: HttpClient) {}

  createAppointment(data: CreateAppointmentRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, data, {
      headers: this.getAuthHeaders(),
    });
  }

  getAppointments(page?: number, limit?: number): Observable<any> {
    let url = this.apiUrl;
    if (page && limit) {
      url += `?page=${page}&limit=${limit}`;
    }
    return this.http.get<any>(url, {
      headers: this.getAuthHeaders(),
    });
  }

  getAppointmentById(id: string): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  getAppointmentsByPatient(patientId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/patient/${patientId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  getAppointmentsByDoctor(doctorId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/doctor/${doctorId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  getAppointmentsByDate(date: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/date/${date}`, {
      headers: this.getAuthHeaders(),
    });
  }

  updateAppointment(id: string, data: UpdateAppointmentRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data, {
      headers: this.getAuthHeaders(),
    });
  }

  cancelAppointment(id: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/${id}`,
      { status: 'CANCELED' },
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  completeAppointment(id: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/${id}`,
      { status: 'COMPLETED' },
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  deleteAppointment(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  getAvailableSlots(doctorId: string, date: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/available-slots?doctorId=${doctorId}&date=${date}`, {
      headers: this.getAuthHeaders(),
    });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }
}
