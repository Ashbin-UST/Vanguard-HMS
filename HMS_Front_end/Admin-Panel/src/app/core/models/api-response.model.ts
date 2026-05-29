/**
 * Backend response contracts.
 *
 * The HMS backend does NOT wrap responses in { success, message, data }.
 * Instead every endpoint returns a flat object that always contains a
 * `message` string plus operation-specific fields, e.g.
 *
 *   { message, token, user }
 *   { message, total, page, limit, totalPages, patients: [...] }
 *
 * These interfaces model those real shapes so services never unwrap a
 * non-existent envelope.
 */

// Common base — every backend JSON response carries a message.
export interface ApiMessage {
  message: string;
}

// Generic paginated list envelope used by patients / appointments / audit logs.
export interface Paginated<T> extends ApiMessage {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  // The actual array key differs per endpoint (patients, appointments, logs),
  // so concrete response interfaces extend this and add the typed array.
  [key: string]: any;
}
