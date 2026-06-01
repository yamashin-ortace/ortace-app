import { afterEach, describe, expect, it } from "vitest";
import { hasValidAdminBasicAuth } from "./basic-auth";

const originalUser = process.env.ADMIN_BASIC_AUTH_USER;
const originalPassword = process.env.ADMIN_BASIC_AUTH_PASSWORD;

afterEach(() => {
  restoreEnv("ADMIN_BASIC_AUTH_USER", originalUser);
  restoreEnv("ADMIN_BASIC_AUTH_PASSWORD", originalPassword);
});

describe("hasValidAdminBasicAuth", () => {
  it("fails closed when credentials are not configured", () => {
    delete process.env.ADMIN_BASIC_AUTH_USER;
    delete process.env.ADMIN_BASIC_AUTH_PASSWORD;

    expect(hasValidAdminBasicAuth(toBasicAuth("admin", "secret"))).toBe(false);
  });

  it("accepts the configured credentials", () => {
    process.env.ADMIN_BASIC_AUTH_USER = "admin";
    process.env.ADMIN_BASIC_AUTH_PASSWORD = "long-random-secret";

    expect(
      hasValidAdminBasicAuth(toBasicAuth("admin", "long-random-secret")),
    ).toBe(true);
  });

  it("rejects a wrong password", () => {
    process.env.ADMIN_BASIC_AUTH_USER = "admin";
    process.env.ADMIN_BASIC_AUTH_PASSWORD = "long-random-secret";

    expect(hasValidAdminBasicAuth(toBasicAuth("admin", "wrong"))).toBe(false);
  });
});

function toBasicAuth(user: string, password: string): string {
  return `Basic ${btoa(`${user}:${password}`)}`;
}

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}
