import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorBody } from '../models/api-response.model';
import { APP_MESSAGES } from '../constants/messages';

// Single place that turns a failed HTTP call into a user-facing message.
// Components use this instead of repeating `err.error?.message || '...'`.
@Injectable({ providedIn: 'root' })
export class ApiErrorHandlerService {
  message(err: unknown, fallback: string = APP_MESSAGES.GENERIC_ERROR): string {
    if (err instanceof HttpErrorResponse) {
      const body = err.error as ApiErrorBody | undefined;

      // Validation failures carry field-level errors whose first `msg` is
      // more useful than the generic top-level "Validation failed".
      if (err.status === 422 && body?.errors?.length) {
        return body.errors[0].msg;
      }

      return body?.message || fallback;
    }
    return fallback;
  }
}
