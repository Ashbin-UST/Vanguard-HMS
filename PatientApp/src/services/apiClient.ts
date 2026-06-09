import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "@/config/api";

export const TOKEN_KEY = "jwt";

export type ApiOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  // When false, the request is sent without an Authorization header
  // (used for public auth endpoints like login/register).
  auth?: boolean;
};

/**
 * Thin fetch wrapper around the HMS backend.
 * - prefixes API_BASE_URL
 * - attaches the stored patient JWT (unless auth: false)
 * - parses JSON and throws an Error carrying the server `message` on failure
 */
export async function apiFetch<T = any>(
  path: string,
  { method = "GET", body, auth = true }: ApiOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error("Network error. Please check your connection and try again.");
  }

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    // Non-JSON or empty body
  }

  if (!response.ok) {
    const message =
      data?.message ||
      (data?.errors?.[0]?.msg as string | undefined) ||
      `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data as T;
}
