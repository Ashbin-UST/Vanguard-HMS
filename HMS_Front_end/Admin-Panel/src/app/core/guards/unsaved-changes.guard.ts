import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { ConfirmModalService } from '../services/confirm-modal.service';

/**
 * Contract implemented by any form component that wants the unsaved-changes
 * protection. The component decides whether it currently has unsaved edits.
 *
 * Typical implementation: return true when the form is dirty AND not in the
 * middle of/after a successful submit.
 */
export interface CanComponentDeactivate {
  hasUnsavedChanges: () => boolean;
}

/**
 * CanDeactivate guard.
 *
 * When the user tries to leave a form that reports unsaved changes, we show a
 * confirmation modal. If they confirm, navigation proceeds; if they cancel,
 * navigation is blocked and they stay on the form.
 *
 * Note: the typed-in data is ALSO auto-saved to FormDraftService by the form
 * itself, so even if the user confirms "leave", returning to the form restores
 * their entries. This guard is the active "are you sure?" layer on top of that
 * safety net.
 */
export const unsavedChangesGuard: CanDeactivateFn<CanComponentDeactivate> = (
  component,
) => {
  // Defensive: components without the hook can always deactivate.
  if (!component || typeof component.hasUnsavedChanges !== 'function') {
    return true;
  }

  if (!component.hasUnsavedChanges()) {
    return true;
  }

  const confirmModal = inject(ConfirmModalService);

  return confirmModal
    .open({
      title: 'Unsaved Changes',
      message:
        'You have unsaved changes on this form. Your entries are kept if you ' +
        'return, but do you want to leave this page now?',
      confirmText: 'Leave',
      cancelText: 'Stay',
      type: 'warning',
    })
    .then((result) => result.confirmed);
};
