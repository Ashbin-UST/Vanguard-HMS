import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ApiMessage } from '../models/api-response.model';
import {
  LoginResponse,
  MeResponse,
  User,
} from '../models/user.model';
import { Designation } from '../models/employee.model';
import { FormDraftService } from './form-draft.service';

const TOKEN_KEY = 'hms_token';
const USER_KEY = 'hms_user';

// Designations that are treated as superusers (access to everything).
const SUPERUSER_DESIGNATIONS: Designation[] = ['OWNER', 'ADMIN'];

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private formDraft = inject(FormDraftService);

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Signal mirror for components that prefer signals.
  currentUserSignal = signal<User | null>(null);

  private readonly apiUrl = `${environment.apiUrl}/auth`;

  constructor() {
    this.loadUserFromStorage();
  }

  // --- Auth flows ---------------------------------------------------------

  selfRegister(data: any): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(`${this.apiUrl}/self-register`, data);
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap((response) => {
          if (response?.token && response?.user) {
            this.setSession(response.token, response.user);
          }
        }),
      );
  }

  forgotPassword(email: string): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(`${this.apiUrl}/forgot-password`, {
      email,
    });
  }

  // Backend expects { resetToken, newPassword, confirmPassword }.
  resetPassword(
    resetToken: string,
    newPassword: string,
    confirmPassword: string,
  ): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(`${this.apiUrl}/reset-password`, {
      resetToken,
      newPassword,
      confirmPassword,
    });
  }

  // Backend expects { currentPassword, newPassword, confirmPassword }.
  changePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ): Observable<ApiMessage> {
    return this.http.put<ApiMessage>(`${this.apiUrl}/change-password`, {
      currentPassword,
      newPassword,
      confirmPassword,
    });
  }

  // Refreshes the cached user after a page reload (token still in storage).
  refreshCurrentUser(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.apiUrl}/me`).pipe(
      tap((response) => {
        if (response?.user) {
          this.persistUser(response.user);
        }
      }),
    );
  }

  logout(navigate = true): void {
    // A first-login user must change their temporary password before doing
    // anything — including logging out. Block logout while the flag is set.
    if (this.isPasswordChangeRequired()) {
      return;
    }

    // Best-effort server notification; ignore failures.
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
      next: () => {},
      error: () => {},
    });
    this.clearSession();
    if (navigate) {
      this.router.navigate(['/login']);
    }
  }

  // True if the logged-in user must change their password before proceeding.
  isPasswordChangeRequired(): boolean {
    return !!this.getCurrentUser()?.mustChangePassword;
  }

  /**
   * Unconditionally clears the session and redirects to login. Used by the
   * HTTP interceptor on a genuine 401 (expired/invalid token), which must
   * succeed even when mustChangePassword would otherwise block logout().
   */
  forceClearSession(navigate = true): void {
    this.clearSession();
    if (navigate) {
      this.router.navigate(['/login']);
    }
  }

  // --- Session management -------------------------------------------------

  private setSession(token: string, user: User): void {
    localStorage.setItem(TOKEN_KEY, token);
    this.persistUser(user);
  }

  private persistUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
    this.currentUserSignal.set(user);
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.formDraft.clearAll();
    this.currentUserSubject.next(null);
    this.currentUserSignal.set(null);
  }

  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) {
      return;
    }
    try {
      const user = JSON.parse(userStr) as User;
      this.currentUserSubject.next(user);
      this.currentUserSignal.set(user);
    } catch {
      this.clearSession();
    }
  }

  // --- Accessors ----------------------------------------------------------

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getDesignation(): Designation | null {
    return this.getCurrentUser()?.profile?.designation ?? null;
  }

  // True if the user is OWNER or ADMIN (full access).
  isSuperUser(): boolean {
    const designation = this.getDesignation();
    return !!designation && SUPERUSER_DESIGNATIONS.includes(designation);
  }

  /**
   * Access check by designation. OWNER and ADMIN always pass (superusers).
   * Otherwise the user's designation must be in the allowed list.
   */
  hasDesignation(allowed: Designation[]): boolean {
    const designation = this.getDesignation();
    if (!designation) {
      return false;
    }
    if (SUPERUSER_DESIGNATIONS.includes(designation)) {
      return true;
    }
    return allowed.includes(designation);
  }
}
