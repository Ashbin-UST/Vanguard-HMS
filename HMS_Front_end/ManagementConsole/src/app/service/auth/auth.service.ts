import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor() { }
  IsloggedIn():boolean{
    return !!localStorage.getItem('token');
  }


  setToken(token: string) {
    localStorage.setItem('token', token);
  }
  setUser(user: any) {
    localStorage.setItem('user', JSON.stringify(user));
  }
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

}
