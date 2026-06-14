import { describe, expect, it } from "vitest";
import { isSentryTestRouteEnabled } from "./sentry-test";

describe("isSentryTestRouteEnabled", () => {
  it("disables the Sentry test endpoint in production even when a token exists", () => {
    expect(isSentryTestRouteEnabled("production", "test-token")).toBe(false);
  });

  it("keeps the endpoint available outside production when a token exists", () => {
    expect(isSentryTestRouteEnabled("development", "test-token")).toBe(true);
  });
});
