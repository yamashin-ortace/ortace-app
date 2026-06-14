import { describe, expect, it } from "vitest";
import {
  buildContactRateLimitBuckets,
  getClientIpFromHeaders,
  summarizeContactRateLimitResults,
} from "./rate-limit";

describe("contact rate limit", () => {
  it("builds hashed IP and email buckets without storing raw identifiers", () => {
    const buckets = buildContactRateLimitBuckets({
      ip: "203.0.113.4",
      email: "Student@Example.COM",
    });

    expect(buckets).toHaveLength(2);
    expect(buckets.map((bucket) => bucket.scope)).toEqual(["ip", "email"]);
    expect(buckets.map((bucket) => bucket.limit)).toEqual([3, 5]);
    expect(buckets.map((bucket) => bucket.windowSeconds)).toEqual([300, 3600]);
    expect(buckets.every((bucket) => !bucket.key.includes("203.0.113.4"))).toBe(
      true,
    );
    expect(buckets.every((bucket) => !bucket.key.includes("Student"))).toBe(true);
  });

  it("uses the first forwarded IP address", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.4, 10.0.0.2",
    });

    expect(getClientIpFromHeaders(headers)).toBe("203.0.113.4");
  });

  it("reports the longest retry window when any bucket is denied", () => {
    expect(
      summarizeContactRateLimitResults([
        { allowed: true, retryAfterSeconds: 0 },
        { allowed: false, retryAfterSeconds: 42 },
        { allowed: false, retryAfterSeconds: 20 },
      ]),
    ).toEqual({ allowed: false, retryAfterSeconds: 42 });
  });
});
