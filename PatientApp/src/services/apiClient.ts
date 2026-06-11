import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "@/config/api";
import { MESSAGES } from "@/constants/messages";

export const TOKEN_KEY = "jwt";

export type ApiOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  // When false, the request is sent without an Authorization header
  // (used for public auth endpoints like login/register).
  auth?: boolean;
};

/** Field-level validation error item, as sent by the backend. */
export type ApiFieldError = { msg: string; path?: string };

/** Wire envelope every backend response uses. */
type Envelope<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  errors?: ApiFieldError[];
};

/**
 * Error thrown for every failed API call. Carries the HTTP status code
 * (0 for network failures) and any field-level validation errors.
 */
export class ApiError extends Error {
  statusCode: number;
  errors?: ApiFieldError[];

  constructor(statusCode: number, message: string, errors?: ApiFieldError[]) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

/**
 * Thin fetch wrapper around the HMS backend.
 * - prefixes API_BASE_URL
 * - attaches the stored patient JWT (unless auth: false)
 * - unwraps the success envelope and resolves with its `data` payload
 * - throws an ApiError carrying the server message/status on failure
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
    throw new ApiError(0, MESSAGES.NETWORK_ERROR);
  }

  let envelope: Envelope<T> | null = null;
  try {
    envelope = await response.json();
  } catch {
    // Non-JSON or empty body
  }

  if (!response.ok || envelope?.success === false) {
    // 422 carries field-level errors whose first `msg` is more useful than
    // the generic top-level "Validation failed" message.
    const message =
      (response.status === 422 && envelope?.errors?.[0]?.msg) ||
      envelope?.message ||
      MESSAGES.REQUEST_FAILED(response.status);
    throw new ApiError(response.status, message, envelope?.errors);
  }

  return envelope?.data as T;
}
