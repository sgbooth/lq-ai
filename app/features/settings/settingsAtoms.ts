import { sessionAtom } from "@/auth/authAtoms.ts";
import { getPreferences, patchPreferences } from "@/features/settings/preferencesApi.ts";
import type { Preferences } from "@/shared/types.ts";
import { atom } from "jotai";
import { settingsAtom } from "@/shared/preferencesAtoms.ts";
export { settingsAtom } from "@/shared/preferencesAtoms.ts";
export const autonomousEnabledAtom = atom((get) => get(settingsAtom).autonomous_enabled);
/** Guards wait for the server value instead of treating the default as the user's choice. */
export const settingsStatusAtom = atom<"loading" | "ready" | "error">("loading");
export const loadSettingsAtom = atom(null, async (get, set) => {
  const id = get(sessionAtom)?.user.id;
  set(settingsStatusAtom, "loading");
  try {
    const settings = await getPreferences();
    if (get(sessionAtom)?.user.id !== id) return;
    set(settingsAtom, settings);
    set(settingsStatusAtom, "ready");
  } catch (error) {
    if (get(sessionAtom)?.user.id === id) set(settingsStatusAtom, "error");
    throw error;
  }
});
export const saveSettingsAtom = atom(null, async (_get, set, patch: Partial<Preferences>) => {
  set(settingsAtom, await patchPreferences(patch));
});
