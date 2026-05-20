import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class OperationReportTotalService {
api = 'http://localhost:5000/api/dashboard/operationreporttotal';

 
  constructor(private http: HttpClient) { }

  getDashboardData() {
    return this.http.get<{appointmentno: number; employeeno: number; billingno: number; appointments: any[]; employees: any[]; billings: any[] }>(this.api);
  }
}
