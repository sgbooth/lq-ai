import {
  buildAuthorizeUrl,
  buildOAuthReturnUrl,
  parseOAuthReturn,
  stripOAuthReturn,
} from "@/shared/chat/toolGate.ts";
import { describe, expect, it } from "vitest";

describe("MCP OAuth return", () => {
  it("reads the server name from the success parameter the backend actually sends", () => {
    expect(parseOAuthReturn(new URLSearchParams("mcp_connected=docs&mcp_chat=c1"))).toEqual({
      status: "connected",
      server: "docs",
      chatId: "c1",
    });
  });
  it("reports failures with their server", () => {
    expect(parseOAuthReturn(new URLSearchParams("mcp_error=denied&server=docs"))).toEqual({
      status: "error",
      server: "docs",
      chatId: null,
    });
  });
  it("returns to the current surface instead of the global chats page", () => {
    expect(
      buildOAuthReturnUrl("https://lq.example/matters/m1?tab=chat&mcp_connected=old", "c1"),
    ).toBe("https://lq.example/matters/m1?tab=chat&mcp_chat=c1");
  });
  it("omits the conversation when none exists yet", () => {
    expect(buildOAuthReturnUrl("https://lq.example/chats", undefined)).toBe(
      "https://lq.example/chats",
    );
  });
  it("strips return parameters so a reload cannot repeat the prompt", () => {
    expect(
      stripOAuthReturn("https://lq.example/chats?id=c1&mcp_connected=docs&mcp_chat=c1#end"),
    ).toBe("/chats?id=c1#end");
  });
  it("preserves an authorize URL's existing query", () => {
    expect(buildAuthorizeUrl("https://gw/authorize?a=1", "https://lq/x?y=2")).toBe(
      "https://gw/authorize?a=1&return_url=https%3A%2F%2Flq%2Fx%3Fy%3D2",
    );
  });
});
