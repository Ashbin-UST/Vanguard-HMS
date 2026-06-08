import { apiFetch } from "./apiClient";
import type { Patient, ProfileUpdatePayload } from "./types";

type ProfileResponse = { message: string; patient: Patient };

export function getMyProfile() {
  return apiFetch<ProfileResponse>("/patient/me");
}

export function updateMyProfile(payload: ProfileUpdatePayload) {
  return apiFetch<ProfileResponse>("/patient/me", {
    method: "PUT",
    body: payload,
  });
}
