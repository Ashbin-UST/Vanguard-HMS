import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Patient } from '../models/patient.model';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/patients`;

  createPatient(data: any): Observable<ApiResponse<Patient>> {
    return this.http.post<ApiResponse<Patient>>(this.apiUrl, data);
  }

  getAllPatients(page: number = 1, limit: number = 10, filters?: any): Observable<ApiResponse<Patient[]>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.gender) params = params.set('gender', filters.gender);

    return this.http.get<ApiResponse<Patient[]>>(this.apiUrl, { params });
  }

  getPatientById(id: string): Observable<ApiResponse<Patient>> {
    return this.http.get<ApiResponse<Patient>>(`${this.apiUrl}/${id}`);
  }

  updatePatient(id: string, data: any): Observable<ApiResponse<Patient>> {
    return this.http.put<ApiResponse<Patient>>(`${this.apiUrl}/${id}`, data);
  }

  deletePatient(id: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${id}`);
  }

  searchPatients(query: string): Observable<ApiResponse<Patient[]>> {
    const params = new HttpParams().set('q', query);
    return this.http.get<ApiResponse<Patient[]>>(`${this.apiUrl}/search`, { params });
  }
}