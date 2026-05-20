import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class AppointmentslistService {
  api = 'http://localhost:5000/api/appointments';

  constructor(private http: HttpClient) {}

  getContent() {
    return this.http.get<{
      appointmentId: string;
      patientId: string;
      doctorId: string;
      status: string;
      createdAt: string;
      __v: number;
    }[]>(this.api);
  }
}
