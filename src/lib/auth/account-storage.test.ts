import { afterEach, describe, expect, it } from "vitest";
import {
  createAccountStorageKey,
  getAccountStorageKey,
  isAccountStorageUser,
} from "./account-storage";

describe("account storage", () => {
  afterEach(() => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: undefined,
    });
  });

  it("adds the user id to account-scoped storage keys", () => {
    expect(createAccountStorageKey("ortace.stats", "user-123")).toBe(
      "ortace.stats:v3:user-123",
    );
  });

  it("uses an isolated key when there is no signed-in user", () => {
    expect(createAccountStorageKey("ortace.stats", null)).toBe(
      "ortace.stats:v3:unscoped",
    );
  });

  it("never falls back to a legacy shared key", () => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {},
    });

    expect(getAccountStorageKey("ortace.stats")).toBe(
      "ortace.stats:v3:unscoped",
    );
  });

  it("matches only the account rendered into the current document", () => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        __ORTACE_ACCOUNT_USER_ID__: "user-123",
      },
    });

    expect(isAccountStorageUser("user-123")).toBe(true);
    expect(isAccountStorageUser("user-456")).toBe(false);
  });
});
