import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MeResponse } from '../models/user.model';
import { DoctorsResponse } from '../models/appointment.model';
import { ApiResponse } from '../models/api-response.model';
import { EmployeeProfile } from '../models/employee.model';

// PUT /employees/update-profile response. OWNER/ADMIN updates apply
// immediately (employee payload); staff updates create a pending request.
export type ProfileUpdateRequestResponse = ApiResponse<{
  employee?: EmployeeProfile;
  request?: {
    requestId: string;
    status: string;
    requestedChanges: Record<string, { old?: any; new?: any }>;
  };
}>;

// Self-editable profile fields (phone + qualification only)
export interface ProfileUpdatePayload {
  phone?: string;
  qualification?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/employees`;

  // Current authenticated user and profile
  getMe(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.apiUrl}/me`);
  }

  // Active doctors for the appointment booking dropdown
  getDoctors(): Observable<DoctorsResponse> {
    return this.http.get<DoctorsResponse>(`${this.apiUrl}/doctors`);
  }

  // Updates own profile; OWNER/ADMIN apply immediately, staff changes need approval
  profileUpdate(
    data: ProfileUpdatePayload,
  ): Observable<ProfileUpdateRequestResponse> {
    return this.http.put<ProfileUpdateRequestResponse>(
      `${this.apiUrl}/update-profile`,
      data,
    );
  }
}