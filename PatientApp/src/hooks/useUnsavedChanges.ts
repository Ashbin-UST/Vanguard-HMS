import { useRouter } from "expo-router";
import { useEffect } from "react";
import { BackHandler } from "react-native";
import { useNavGuard } from "@/store/navGuard";

/**
 * The `CanComponentDeactivate` contract for RN forms.
 *
 * A form calls `useUnsavedChanges(isDirty)` to publish whether it currently holds
 * unsaved input. While mounted it keeps the shared nav guard in sync; on unmount it
 * resets the flag. It also intercepts the Android hardware back button so that, like
 * the on-screen affordances, it prompts before discarding a dirty form.
 */
export function useUnsavedChanges(isDirty: boolean) {
  const setDirty = useNavGuard((s) => s.setDirty);
  const confirmLeave = useNavGuard((s) => s.confirmLeave);
  const router = useRouter();

  useEffect(() => {
    setDirty(isDirty);
  }, [isDirty, setDirty]);

  // Clear the flag when the form unmounts (only one form is mounted at a time).
  useEffect(() => () => setDirty(false), [setDirty]);

  // Android hardware back (no-op on iOS/web — the listener never fires there).
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!useNavGuard.getState().isDirty) return false; // allow default back
      confirmLeave().then((leave) => {
        if (leave) router.back();
      });
      return true; // we handled it; block the default back
    });
    return () => sub.remove();
  }, [confirmLeave, router]);
}
