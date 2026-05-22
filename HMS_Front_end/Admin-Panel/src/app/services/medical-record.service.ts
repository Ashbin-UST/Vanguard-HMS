import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MedicalRecord, CreateMedicalRecordRequest, UpdateMedicalRecordRequest } from '../models/medical-record.model';

@Injectable({
  providedIn: 'root',
})
export class MedicalRecordService {
  private readonly apiUrl = 'http://localhost:5000/api/medical-records';

  constructor(private readonly http: HttpClient) {}

  createMedicalRecord(data: CreateMedicalRecordRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, data, {
      headers: this.getAuthHeaders(),
    });
  }

  getMedicalRecords(page?: number, limit?: number): Observable<any> {
    let url = this.apiUrl;
    if (page && limit) {
      url += `?page=${page}&limit=${limit}`;
    }
    return this.http.get<any>(url, {
      headers: this.getAuthHeaders(),
    });
  }

  getMedicalRecordById(id: string): Observable<MedicalRecord> {
    return this.http.get<MedicalRecord>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  getMedicalRecordsByPatient(patientId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/patient/${patientId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  getMedicalRecordsByDoctor(doctorId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/doctor/${doctorId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  getMedicalRecordsByAppointment(appointmentId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/appointment/${appointmentId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  updateMedicalRecord(id: string, data: UpdateMedicalRecordRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data, {
      headers: this.getAuthHeaders(),
    });
  }

  deleteMedicalRecord(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  searchMedicalRecords(query: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/search?q=${query}`, {
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
