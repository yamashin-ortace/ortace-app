import { describe, expect, it } from "vitest";
import { sanitizeContactHeaderText } from "./input";

describe("sanitizeContactHeaderText", () => {
  it("removes control characters that could break mail headers", () => {
    expect(sanitizeContactHeaderText("山田\nBCC: attacker@example.com", 80)).toBe(
      "山田 BCC: attacker@example.com",
    );
  });
});
