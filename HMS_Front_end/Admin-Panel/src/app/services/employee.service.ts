import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Employee } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private apiUrl = 'http://localhost:5000/api';

  constructor(private readonly http: HttpClient) {}

  createEmployee(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/create-employee`, data, {
      headers: this.getAuthHeaders(),
    });
  }

  getEmployees(page?: number, limit?: number): Observable<any> {
    let url = `${this.apiUrl}/admin/employees`;
    if (page && limit) {
      url += `?page=${page}&limit=${limit}`;
    }
    return this.http.get<any>(url, {
      headers: this.getAuthHeaders(),
    });
  }

  getEmployeeById(id: string): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/employees/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  getEmployeeByCode(code: string): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/employees/code/${code}`, {
      headers: this.getAuthHeaders(),
    });
  }

  getDoctors(): Observable<any> {
    return this.http.get(`${this.apiUrl}/employees/designation/DOCTOR`, {
      headers: this.getAuthHeaders(),
    });
  }

  getStaff(): Observable<any> {
    return this.http.get(`${this.apiUrl}/employees/designation/STAFF`, {
      headers: this.getAuthHeaders(),
    });
  }

  updateEmployee(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/employees/${id}`, data, {
      headers: this.getAuthHeaders(),
    });
  }

  updateProfile(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/employees/profile`, data, {
      headers: this.getAuthHeaders(),
    });
  }

  deleteEmployee(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/employees/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  searchEmployees(query: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/employees/search?q=${query}`, {
      headers: this.getAuthHeaders(),
    });
  }

  getEmployeesByDepartment(department: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/employees/department/${department}`, {
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
