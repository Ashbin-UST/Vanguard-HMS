import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Injectable({
  providedIn: 'root',
})

export class SignupService {
api = 'http://localhost:5000/api/auth/signup';
// api='http://vanguard-hms.vercel.app/api/auth/signup';
  constructor(private http:HttpClient) {

   }

   signupsubmit(registrationData:any){
    alert(registrationData.username);

    return this.http.post(this.api,registrationData);

   }
}
