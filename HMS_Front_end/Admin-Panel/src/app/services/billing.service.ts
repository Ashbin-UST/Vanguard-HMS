import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Bill, CreateBillRequest, UpdateBillRequest } from '../models/bill.model';

@Injectable({
  providedIn: 'root',
})
export class BillingService {
  private readonly apiUrl = 'http://localhost:5000/api/bills';

  constructor(private readonly http: HttpClient) {}

  createBill(data: CreateBillRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, data, {
      headers: this.getAuthHeaders(),
    });
  }

  getBills(page?: number, limit?: number): Observable<any> {
    let url = this.apiUrl;
    if (page && limit) {
      url += `?page=${page}&limit=${limit}`;
    }
    return this.http.get<any>(url, {
      headers: this.getAuthHeaders(),
    });
  }

  getBillById(id: string): Observable<Bill> {
    return this.http.get<Bill>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  getBillByBillId(billId: string): Observable<Bill> {
    return this.http.get<Bill>(`${this.apiUrl}/billid/${billId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  getBillsByPatient(patientId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/patient/${patientId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  getBillsByStatus(status: 'PENDING' | 'PAID' | 'PARTIAL'): Observable<any> {
    return this.http.get(`${this.apiUrl}/status/${status}`, {
      headers: this.getAuthHeaders(),
    });
  }

  updateBill(id: string, data: UpdateBillRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data, {
      headers: this.getAuthHeaders(),
    });
  }

  markAsPaid(id: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/${id}`,
      { status: 'PAID' },
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  markAsPartial(id: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/${id}`,
      { status: 'PARTIAL' },
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  deleteBill(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  getBillReport(startDate: string, endDate: string): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/report?startDate=${startDate}&endDate=${endDate}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }
}
