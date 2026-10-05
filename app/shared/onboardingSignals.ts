import { store } from "@/Atoms.ts";
import { userAtom } from "@/auth/authAtoms.ts";
export type OnboardingSignal = "skill-document" | "enhance";
const signalKey = (userId: string, signal: OnboardingSignal) =>
  `lq-ai:onboarded:${userId}:${signal}`;
export function recordOnboardingSignal(signal: OnboardingSignal, userId = store.get(userAtom)?.id) {
  if (!userId) return;
  try {
    localStorage.setItem(signalKey(userId, signal), "true");
  } catch {
    /* Optional usage memory. */
  }
}
export function readOnboardingSignal(userId: string, signal: OnboardingSignal): boolean {
  try {
    return localStorage.getItem(signalKey(userId, signal)) === "true";
  } catch {
    return false;
  }
}
