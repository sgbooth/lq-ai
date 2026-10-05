import { defaultSelection, groupModels, type ModelListResponse } from "@/shared/modelsApi.ts";
const keyFor = (userId: string, chatId: string) => `lq-ai:model:${userId}:${chatId}`;
export function rememberChatModel(userId: string, chatId: string, model: string) {
  try {
    localStorage.setItem(keyFor(userId, chatId), model);
  } catch {
    /* Optional persistence. */
  }
}
export function recalledChatModel(
  userId: string,
  chatId: string | undefined,
  models: ModelListResponse,
): string | null {
  let remembered: string | null = null;
  try {
    if (chatId) remembered = localStorage.getItem(keyFor(userId, chatId));
  } catch {
    /* Optional persistence. */
  }
  return models.data.some((m) => m.id === remembered)
    ? remembered
    : (defaultSelection(groupModels(models))?.id ?? null);
}
