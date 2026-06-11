import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiMessage, ApiResponse } from '../models/api-response.model';
import { CreateEmployeePayload, EmployeeListItem, UpdateEmployeePayload } from '../models/employee.model';
import { AuditLogsResponse } from '../models/audit.model';
import { ProfileChangeRequestsResponse } from '../models/profile-change-request.model';

// GET /admin/employees and /admin/pending-employees response shape
export type EmployeesResponse = ApiResponse<{
  totalEmployees: number;
  employees: EmployeeListItem[];
}>;

// GET /admin/employees/:employeeCode response shape
export type EmployeeResponse = ApiResponse<EmployeeListItem>;

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admin`;

  // Employee management
  createEmployee(data: CreateEmployeePayload): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(`${this.apiUrl}/create-employee`, data);
  }

  getEmployees(): Observable<EmployeesResponse> {
    return this.http.get<EmployeesResponse>(`${this.apiUrl}/employees`);
  }

  getEmployee(employeeCode: string): Observable<EmployeeResponse> {
    return this.http.get<EmployeeResponse>(`${this.apiUrl}/employees/${employeeCode}`);
  }

  getPendingEmployees(): Observable<EmployeesResponse> {
    return this.http.get<EmployeesResponse>(
      `${this.apiUrl}/pending-employees`,
    );
  }

  approveEmployee(employeeCode: string): Observable<ApiMessage> {
    return this.http.put<ApiMessage>(
      `${this.apiUrl}/approve-employee/${employeeCode}`,
      {},
    );
  }

  rejectEmployee(employeeCode: string): Observable<ApiMessage> {
    return this.http.put<ApiMessage>(
      `${this.apiUrl}/reject-employee/${employeeCode}`,
      {},
    );
  }

  updateEmployee(
    employeeCode: string,
    data: UpdateEmployeePayload,
  ): Observable<ApiMessage> {
    return this.http.put<ApiMessage>(
      `${this.apiUrl}/update-employee/${employeeCode}`,
      data,
    );
  }

  deleteEmployee(employeeCode: string): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(
      `${this.apiUrl}/delete-employee/${employeeCode}`,
    );
  }

  // Recent activity (audit logs)
  getAuditLogs(page = 1, limit = 20): Observable<AuditLogsResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<AuditLogsResponse>(`${this.apiUrl}/audit-logs`, {
      params,
    });
  }

  // Profile change requests
  getProfileChangeRequests(): Observable<ProfileChangeRequestsResponse> {
    return this.http.get<ProfileChangeRequestsResponse>(
      `${this.apiUrl}/profile-change-requests`,
    );
  }

  approveProfileChange(requestId: string): Observable<ApiMessage> {
    return this.http.put<ApiMessage>(
      `${this.apiUrl}/approve-profile-change/${requestId}`,
      {},
    );
  }

  rejectProfileChange(requestId: string): Observable<ApiMessage> {
    return this.http.put<ApiMessage>(
      `${this.apiUrl}/reject-profile-change/${requestId}`,
      {},
    );
  }
}
