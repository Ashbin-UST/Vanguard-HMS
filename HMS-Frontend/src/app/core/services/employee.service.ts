import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Employee } from '../models/employee.model';

export interface EmployeeFilters {
  status?: string;
  department?: string;
}
@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/employees`;

  /**
   * Get employees with search, filter & pagination.
   *
   * @param page    - page number (1-based)
   * @param limit   - items per page
   * @param filters - { status?, department? }
   * @param search  - search query (optional)
   */
  getEmployees(
    page: number = 1,
    limit: number = 10,
    filters?: EmployeeFilters,
    search?: string
  ): Observable<ApiResponse<Employee[]>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.department) {
      params = params.set('department', filters.department);
    }
    if (search && search.trim().length >= 2) {
      params = params.set('search', search.trim());
    }

    return this.http.get<ApiResponse<Employee[]>>(this.apiUrl, { params });
  }

  /**
   * Get a single employee by ID (for edit form pre-fill).
   */
  getEmployeeById(id: string): Observable<ApiResponse<Employee>> {
    return this.http.get<ApiResponse<Employee>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new employee.
   */
  createEmployee(data: Partial<Employee>): Observable<ApiResponse<Employee>> {
    return this.http.post<ApiResponse<Employee>>(this.apiUrl, data);
  }

  /**
   * Update an existing employee.
   */
  updateEmployee(id: string, data: Partial<Employee>): Observable<ApiResponse<Employee>> {
    return this.http.put<ApiResponse<Employee>>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Toggle employee ACTIVE ↔ INACTIVE status.
   */
  toggleStatus(id: string): Observable<ApiResponse<Employee>> {
    return this.http.patch<ApiResponse<Employee>>(`${this.apiUrl}/${id}/status`, {});
  }
}