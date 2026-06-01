import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MeResponse } from '../models/user.model';
import { DoctorsResponse } from '../models/appointment.model';

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

  // Current authenticated user + profile (used after a refresh, and as the
  // single source of truth for the logged-in user's own profile).
  getMe(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.apiUrl}/me`);
  }

  // Active doctors for the appointment booking dropdown.
  getDoctors(): Observable<DoctorsResponse> {
    return this.http.get<DoctorsResponse>(`${this.apiUrl}/doctors`);
  }

  // Update the logged-in user's profile. OWNER/ADMIN are applied immediately;
  // staff changes create a request that requires admin approval.
  profileUpdate(
    data: ProfileUpdatePayload,
  ): Observable<ProfileUpdateRequestResponse> {
    return this.http.put<ProfileUpdateRequestResponse>(
      `${this.apiUrl}/update-profile`,
      data,
    );
  }
}