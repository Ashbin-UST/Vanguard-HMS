import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PendingApproval } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admin`;

  getPendingApprovals(): Observable<ApiResponse<PendingApproval[]>> {
    return this.http.get<ApiResponse<PendingApproval[]>>(`${this.apiUrl}/pending-approvals`);
  }

  approveEmployee(userId: string): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/approve/${userId}`, {});
  }

  rejectEmployee(userId: string, reason?: string): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/reject/${userId}`, { reason });
  }

  createEmployee(data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/create-employee`, data);
  }

  getAllUsers(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/users`);
  }
}