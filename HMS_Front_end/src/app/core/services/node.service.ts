import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MyNodesResponse } from '../models/node.model';

@Injectable({
  providedIn: 'root',
})
export class NodeService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/nodes`;

  // Sidebar nodes for the logged-in user (already filtered by designation).
  getMyNodes(): Observable<MyNodesResponse> {
    return this.http.get<MyNodesResponse>(`${this.apiUrl}/my-nodes`);
  }
}
