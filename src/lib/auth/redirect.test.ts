import { describe, expect, it } from "vitest";
import { normalizeAuthRedirectPath } from "./redirect";

describe("normalizeAuthRedirectPath", () => {
  it("keeps ordinary same-origin paths", () => {
    expect(normalizeAuthRedirectPath("/study?mode=weak", "https://ortace.jp")).toBe(
      "/study?mode=weak",
    );
  });

  it("falls back to root when URL parsing would leave the app origin", () => {
    for (const value of ["//evil.com", "/%5Cevil.com", "/\\evil.com", "/%0A/evil.com"]) {
      expect(normalizeAuthRedirectPath(value, "https://ortace.jp")).toBe("/");
    }
  });
});
