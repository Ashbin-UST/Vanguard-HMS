import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Patient, CreatePatientRequest, UpdatePatientRequest } from '../models/patient.model';

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  private readonly apiUrl = 'http://localhost:5000/api/patients';

  constructor(private readonly http: HttpClient) {}

  createPatient(data: CreatePatientRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, data, {
      headers: this.getAuthHeaders(),
    });
  }

  getPatients(page?: number, limit?: number): Observable<any> {
    let url = this.apiUrl;
    if (page && limit) {
      url += `?page=${page}&limit=${limit}`;
    }
    return this.http.get<any>(url, {
      headers: this.getAuthHeaders(),
    });
  }

  getPatientById(id: string): Observable<Patient> {
    return this.http.get<Patient>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  getPatientByUHID(uhid: string): Observable<Patient> {
    return this.http.get<Patient>(`${this.apiUrl}/uhid/${uhid}`, {
      headers: this.getAuthHeaders(),
    });
  }

  updatePatient(id: string, data: UpdatePatientRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data, {
      headers: this.getAuthHeaders(),
    });
  }

  deletePatient(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  searchPatients(query: string): Observable<any> {
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
