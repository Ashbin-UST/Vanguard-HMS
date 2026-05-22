import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
api = 'http://localhost:5000/api/auth/login';
  constructor(private http:HttpClient) { }
  loginsubmit(loginData:any){
    
    return this.http.post(this.api,loginData);
  }
}