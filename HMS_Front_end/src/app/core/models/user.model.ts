import { EmployeeProfile, Designation, UserRole } from './employee.model';
export interface User {
  id: string;
  username: string;
  email: string;
  roles: UserRole[];
  mustChangePassword?: boolean;
  lastLoginAt?: string | null;
  profile: EmployeeProfile;
}

// POST /auth/login response.
export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

// GET /auth/me and GET /employees/me response.
export interface MeResponse {
  message: string;
  user: User;
}

// Re-export commonly used role types so consumers can import from one place.
export type { Designation, UserRole } from './employee.model';

export function getDesignation(user: User | null): Designation | null {
  return user?.profile?.designation ?? null;
}
