import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

import { EmployeeProfile } from '../models/employee.model';
import { MeResponse } from '../models/user.model';
import { DoctorsResponse } from '../models/appointment.model';

// GET /employees/profile response.
export interface ProfileResponse {
  message: string;
  profile: EmployeeProfile;
}

// PUT /employees/update-profile response.
export interface ProfileUpdateRequestResponse {
  message: string;
  request: {
    requestId: string;
    status: string;
    requestedChanges: Record<string, { old?: any; new?: any }>;
  };
}

// Self-editable profile fields (phone + qualification only).
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

  // Current authenticated user + profile (used after a refresh).
  getMe(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.apiUrl}/me`);
  }

  // Logged-in employee's profile.
  getProfile(): Observable<ProfileResponse> {
    return this.http.get<ProfileResponse>(`${this.apiUrl}/profile`);
  }

  // Active doctors for the appointment booking dropdown.
  getDoctors(): Observable<DoctorsResponse> {
    return this.http.get<DoctorsResponse>(`${this.apiUrl}/doctors`);
  }

  // Submit a profile change request (requires admin approval).
  requestProfileUpdate(
    data: ProfileUpdatePayload,
  ): Observable<ProfileUpdateRequestResponse> {
    return this.http.put<ProfileUpdateRequestResponse>(
      `${this.apiUrl}/update-profile`,
      data,
    );
  }
}
