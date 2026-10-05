/** Pure helpers for the chat tool-gate UI (PR6b). No network. */

import type {
  McpAuthorizationRequiredFrame,
  ToolConfirmationRequiredFrame,
} from "@/shared/types.ts";

/**
 * A paused tool-loop gate, keyed to the assistant message whose turn paused.
 * Shared across ChatPanel (owner), MessageList (pass-through), and MessageBubble
 * (renderer) so the shape stays identical at every layer.
 */
export type PendingGate =
  | { assistantId: string; kind: "confirm"; frame: ToolConfirmationRequiredFrame }
  | { assistantId: string; kind: "connect"; frame: McpAuthorizationRequiredFrame };

export interface OAuthReturn {
  status: "connected" | "error" | "none";
  server: string | null;
  chatId: string | null;
}

const OAUTH_RETURN_PARAMS = ["mcp_connected", "mcp_error", "server", "mcp_chat"];

/**
 * Parse the PR4d OAuth-callback return query. Success is `?mcp_connected={server}`;
 * failure is `?mcp_error={code}&server={server}`. `mcp_chat` names the paused conversation.
 */
export function parseOAuthReturn(params: URLSearchParams): OAuthReturn {
  const chatId = params.get("mcp_chat");
  if (params.has("mcp_connected"))
    return {
      status: "connected",
      server: params.get("mcp_connected") || params.get("server"),
      chatId,
    };
  if (params.has("mcp_error")) return { status: "error", server: params.get("server"), chatId };
  return { status: "none", server: null, chatId: null };
}

/** Return to the current chat surface (chats, matter or skill trial) and its paused conversation. */
export function buildOAuthReturnUrl(href: string, chatId: string | null | undefined): string {
  const url = new URL(href);
  OAUTH_RETURN_PARAMS.forEach((key) => url.searchParams.delete(key));
  if (chatId) url.searchParams.set("mcp_chat", chatId);
  return url.toString();
}

/** The same-origin path with OAuth-return params removed, so a reload cannot repeat the banner. */
export function stripOAuthReturn(href: string): string {
  const url = new URL(href);
  OAUTH_RETURN_PARAMS.forEach((key) => url.searchParams.delete(key));
  return url.pathname + url.search + url.hash;
}

/** Append `return_url` to an authorize URL, preserving any existing query. */
export function buildAuthorizeUrl(authorizeUrl: string, returnUrl: string): string {
  const sep = authorizeUrl.includes("?") ? "&" : "?";
  return `${authorizeUrl}${sep}return_url=${encodeURIComponent(returnUrl)}`;
}
