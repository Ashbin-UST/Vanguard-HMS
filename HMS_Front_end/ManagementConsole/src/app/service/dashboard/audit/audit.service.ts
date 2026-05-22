import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Activity } from '../../../dash/models/activity.model';

@Injectable({
  providedIn: 'root'
})
export class AuditService {

  private baseUrl = 'http://localhost:5000/api/auth/audit-logs/'; // change to your API

  constructor(private http: HttpClient) {}

  getAuditLogs(): Observable<Activity[]> {
    return this.http.get<Activity[]>(this.baseUrl);
  }
}
``