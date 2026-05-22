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
  setRole(roles: any) {
    alert("Setting role: " + JSON.stringify(roles));
    localStorage.setItem('roles', JSON.stringify( roles));
  }
  getToken(): string | null {
    return localStorage.getItem('token');
  }
  getRole(): string | null {
    const roles = localStorage.getItem('roles');
    return roles ? JSON.parse(roles) : null;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('roles');
  }

}
