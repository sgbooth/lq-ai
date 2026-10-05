/**
 * /api/v1/chats/{chat_id}/receipts — replay-at-read event-log helpers.
 *
 * Wraps the T5 (JSON list) and T6 (JSONL export) backend endpoints from
 * Wave D.1. Owner-of-chat or admin only; backend enforces.
 *
 * The list endpoint goes through the shared `apiRequest` helper (auth
 * header + refresh-on-401 + structured error translation). The JSONL
 * export needs both the response body as text AND the `Content-Disposition`
 * header to recover the filename, neither of which `apiRequest` exposes
 * cleanly, so the export takes a manual `fetch` path while still reusing
 * the base URL constant and the access-token accessor.
 */
import { apiRequest, apiResponseRequest } from "@/shared/api.ts";

export type ReceiptEventKind = "message" | "inference" | "audit" | "skill" | "retrieval" | "error";

export interface ReceiptEvent {
  ts: string;
  kind: ReceiptEventKind;
  detail: Record<string, unknown>;
}

export interface ReceiptsExportResult {
  jsonl: string;
  filename: string;
}

function buildQuery(eventKinds: ReceiptEventKind[] | undefined): string {
  if (!eventKinds || eventKinds.length === 0) {
    return "";
  }
  return `?event_kinds=${encodeURIComponent(eventKinds.join(","))}`;
}

/**
 * GET /api/v1/chats/{chat_id}/receipts — chronological event stream for
 * a chat. Optional `eventKinds` narrows the result to a subset (unknown
 * tokens are silently ignored server-side; we pass the full list and let
 * the backend filter).
 */
export async function listChatReceipts(
  chatId: string,
  eventKinds?: ReceiptEventKind[],
): Promise<ReceiptEvent[]> {
  const path = `/chats/${encodeURIComponent(chatId)}/receipts${buildQuery(eventKinds)}`;
  return apiRequest<ReceiptEvent[]>(path, { method: "GET" });
}

/**
 * GET /api/v1/chats/{chat_id}/receipts/export.jsonl — JSONL export.
 *
 * Returns both the raw JSONL text (one event per line) and the filename
 * parsed from the response's `Content-Disposition` header so callers can
 * trigger a browser download with the server-suggested name. Falls back
 * to `chat-{chatId}-receipts.jsonl` if the header is missing or
 * malformed.
 *
 * Uses the shared response client so exports include auth and refresh-on-401.
 */
export async function exportChatReceiptsJsonl(
  chatId: string,
  eventKinds?: ReceiptEventKind[],
): Promise<ReceiptsExportResult> {
  const path = `/chats/${encodeURIComponent(chatId)}/receipts/export.jsonl${buildQuery(eventKinds)}`;
  const res = await apiResponseRequest(path);
  const jsonl = await res.text();
  const disposition = res.headers.get("content-disposition") ?? "";
  const match = /filename="([^"]+)"/.exec(disposition);
  const filename = match?.[1] ?? `chat-${chatId}-receipts.jsonl`;
  return { jsonl, filename };
}
