
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class NavnodeService {
 private api = 'http://localhost:5000/api/dashboard/node/by-role';
  constructor(private http: HttpClient) { }
  //    http://localhost:3000/api/node/by-role?role=${role}` this is the url
  getNavByRole(role: string): Observable<any> {
    return this.http.get(`${this.api}?role=${role}`);
  }

}
