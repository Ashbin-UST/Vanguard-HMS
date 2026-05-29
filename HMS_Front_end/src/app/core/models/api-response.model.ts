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
  [key: string]: any;
}
