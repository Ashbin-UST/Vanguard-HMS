import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly apiUrl = 'http://localhost:5000/api/admin';

  constructor(private readonly http: HttpClient) {}

  createEmployee(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/create-employee`, data, {
      headers: this.getAuthHeaders(),
    });
  }

  getEmployees(page?: number, limit?: number): Observable<any> {
    let url = `${this.apiUrl}/employees`;
    if (page && limit) {
      url += `?page=${page}&limit=${limit}`;
    }
    return this.http.get<any>(url, {
      headers: this.getAuthHeaders(),
    });
  }

  updateEmployee(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/employees/${id}`, data, {
      headers: this.getAuthHeaders(),
    });
  }

  deleteEmployee(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/employees/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  approveEmployee(id: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/employees/${id}/approve`,
      {},
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  rejectEmployee(id: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/employees/${id}/reject`,
      {},
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  getPendingApprovals(): Observable<any> {
    return this.http.get(`${this.apiUrl}/pending-approvals`, {
      headers: this.getAuthHeaders(),
    });
  }

  getSystemStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`, {
      headers: this.getAuthHeaders(),
    });
  }

  getReports(type: string, startDate?: string, endDate?: string): Observable<any> {
    let url = `${this.apiUrl}/reports/${type}`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    return this.http.get<any>(url, {
      headers: this.getAuthHeaders(),
    });
  }

  getDashboardData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard`, {
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
