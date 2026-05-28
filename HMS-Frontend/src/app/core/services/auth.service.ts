import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { LoginResponse, User, Role } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Modern signal-based approach (optional)
  currentUserSignal = signal<User | null>(null);

  private readonly apiUrl = `${environment.apiUrl}/auth`;

  constructor() {
    this.loadUserFromStorage();
  }

  selfRegister(data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/self-register`, data);
  }

  login(email: string, password: string): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.setSession(response.data);
          }
        })
      );
  }

  forgotPassword(email: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/reset-password`, { token, newPassword });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/change-password`, { currentPassword, newPassword });
  }

  getMe(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/me`)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.currentUserSubject.next(response.data);
            this.currentUserSignal.set(response.data);
          }
        })
      );
  }

  private setSession(authResult: LoginResponse): void {
    localStorage.setItem('access_token', authResult.tokens.accessToken);
    localStorage.setItem('refresh_token', authResult.tokens.refreshToken);
    
    const user: User = {
      userId: authResult.userId,
      email: authResult.email,
      roles: authResult.roles,
      status: authResult.status,
      employee: authResult.employee,
      lastLoginAt: authResult.lastLoginAt,
    };
    
    localStorage.setItem('current_user', JSON.stringify(user));
    this.currentUserSubject.next(user);
    this.currentUserSignal.set(user);
  }

  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('current_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
        this.currentUserSignal.set(user);
      } catch {
        this.logout();
      }
    }
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_user');
    this.currentUserSubject.next(null);
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  hasRole(roles: Role[]): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    return user.roles.some(role => roles.includes(role));
  }
}