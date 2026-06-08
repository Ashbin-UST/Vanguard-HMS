import { apiFetch } from "./apiClient";
import type { Patient, RegisterPayload } from "./types";

type LoginResponse = { message: string; token: string; patient: Patient };
type RegisterResponse = { message: string; patient: Patient };
type MessageResponse = { message: string };

export function registerPatient(payload: RegisterPayload) {
  return apiFetch<RegisterResponse>("/patient/auth/register", {
    method: "POST",
    body: payload,
    auth: false,
  });
}

export function loginPatient(email: string, password: string) {
  return apiFetch<LoginResponse>("/patient/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
}

export function forgotPassword(email: string) {
  return apiFetch<MessageResponse>("/patient/auth/forgot-password", {
    method: "POST",
    body: { email },
    auth: false,
  });
}

export function resetPassword(
  resetToken: string,
  newPassword: string,
  confirmPassword: string,
) {
  return apiFetch<MessageResponse>("/patient/auth/reset-password", {
    method: "POST",
    body: { resetToken, newPassword, confirmPassword },
    auth: false,
  });
}

export function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
) {
  return apiFetch<MessageResponse>("/patient/auth/change-password", {
    method: "PUT",
    body: { currentPassword, newPassword, confirmPassword },
  });
}
