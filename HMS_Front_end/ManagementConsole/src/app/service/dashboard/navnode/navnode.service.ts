
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NavnodeService {
 private api = 'http://localhost:5000/api/auth/navnodes';
  constructor(private http: HttpClient) { }
  getNavNodes(): Observable<any> {
    return this.http.get(this.api);
  }
}
