import { Injectable } from '@angular/core';

/**
 * In-memory form draft store.
 *
 * Keeps a snapshot of in-progress form values so that navigating away from a
 * form (accidental click, sidebar link, etc.) and returning does NOT lose the
 * data the user already typed. Drafts live for the app session only — they are
 * intentionally NOT persisted to localStorage/sessionStorage, so nothing
 * survives a full page refresh or tab close (privacy + per your spec).
 *
 * SECURITY: password-like fields are never stored. Any key whose name contains
 * "password" (case-insensitive) is stripped before saving, so half-typed
 * passwords in registration/creation forms are never restored.
 */
@Injectable({
  providedIn: 'root',
})
export class FormDraftService {
  // draftKey -> sanitized form value snapshot
  private drafts = new Map<string, Record<string, any>>();

  // Field-name fragments that must never be persisted.
  private static readonly SENSITIVE_FRAGMENTS = [
    'password',
    'passwd',
    'pwd',
  ];

  /**
   * Save (overwrite) the draft for a given key. The value is deep-cloned and
   * stripped of any password-like fields before storage.
   */
  save(key: string, value: Record<string, any>): void {
    if (!key || value == null) {
      return;
    }
    const sanitized = this.sanitize(value);
    this.drafts.set(key, sanitized);
  }

  /** Returns the saved draft for a key, or null if none exists. */
  get(key: string): Record<string, any> | null {
    const draft = this.drafts.get(key);
    // Return a clone so callers can't mutate the stored copy.
    return draft ? this.clone(draft) : null;
  }

  /** True if a draft exists for the key. */
  has(key: string): boolean {
    return this.drafts.has(key);
  }

  /** Clears the draft for a key (call after a successful submit). */
  clear(key: string): void {
    this.drafts.delete(key);
  }

  /** Clears every draft (e.g. on logout). */
  clearAll(): void {
    this.drafts.clear();
  }

  // --- internals ----------------------------------------------------------

  // Recursively removes password-like keys and deep-clones the rest.
  private sanitize(value: any): any {
    if (Array.isArray(value)) {
      return value.map((item) => this.sanitize(item));
    }

    if (value !== null && typeof value === 'object') {
      const result: Record<string, any> = {};
      for (const [k, v] of Object.entries(value)) {
        if (this.isSensitiveKey(k)) {
          continue;
        }
        result[k] = this.sanitize(v);
      }
      return result;
    }

    // primitive
    return value;
  }

  private isSensitiveKey(key: string): boolean {
    const lower = key.toLowerCase();
    return FormDraftService.SENSITIVE_FRAGMENTS.some((frag) =>
      lower.includes(frag),
    );
  }

  private clone(value: any): any {
    // structuredClone is available in modern browsers/Angular targets;
    // fall back to JSON clone for safety.
    try {
      return structuredClone(value);
    } catch {
      return JSON.parse(JSON.stringify(value));
    }
  }
}
