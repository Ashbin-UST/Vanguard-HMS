import { useRouter } from "expo-router";
import { useNavGuard } from "@/store/navGuard";

type Router = ReturnType<typeof useRouter>;

/**
 * A drop-in replacement for `useRouter()` whose `push`/`replace`/`back` first run
 * the unsaved-changes guard. This is the wiring equivalent of attaching Angular's
 * `canDeactivate` guard to a route: any navigation through these methods prompts the
 * user when the current form is dirty, and only proceeds if they choose "Leave".
 *
 * Use it for "leave" affordances (tab bar, back buttons, cross-screen links).
 * Submit/success navigation should keep using the raw `useRouter()` so saving never
 * triggers the prompt.
 */
export function useGuardedRouter() {
  const router = useRouter();
  const confirmLeave = useNavGuard((s) => s.confirmLeave);

  const push = async (...args: Parameters<Router["push"]>) => {
    if (await confirmLeave()) router.push(...args);
  };
  const replace = async (...args: Parameters<Router["replace"]>) => {
    if (await confirmLeave()) router.replace(...args);
  };
  const back = async () => {
    if (await confirmLeave()) router.back();
  };

  return { push, replace, back };
}
