import { safeNext } from "@/auth/authRedirect.ts";
import { expect, it } from "vitest";
it("returns to the requested product page after sign-in", () => {
  expect(safeNext("?next=" + encodeURIComponent("/matters/m1?tab=chat"))).toBe(
    "/matters/m1?tab=chat",
  );
});
it("rejects off-origin and malformed targets", () => {
  for (const next of ["https://evil.example", "//evil.example", "/\\evil.example", "matters"])
    expect(safeNext("?next=" + encodeURIComponent(next))).toBe("/");
  expect(safeNext("")).toBe("/");
});
