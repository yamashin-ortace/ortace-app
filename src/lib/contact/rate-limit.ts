import { createHash } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/billing/supabase-admin";

export type ContactRateLimitBucket = {
  scope: "ip" | "email";
  key: string;
  limit: number;
  windowSeconds: number;
};

export type ContactRateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export function buildContactRateLimitBuckets({
  ip,
  email,
}: {
  ip: string;
  email: string;
}): ContactRateLimitBucket[] {
  const normalizedIp = ip.trim().toLowerCase() || "unknown";
  const normalizedEmail = email.trim().toLowerCase();
  return [
    {
      scope: "ip",
      key: createBucketKey("ip", normalizedIp),
      limit: 3,
      windowSeconds: 300,
    },
    {
      scope: "email",
      key: createBucketKey("email", normalizedEmail),
      limit: 5,
      windowSeconds: 3600,
    },
  ];
}

export function getClientIpFromHeaders(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return (
    headers.get("cf-connecting-ip")?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export function summarizeContactRateLimitResults(
  results: ContactRateLimitResult[],
): ContactRateLimitResult {
  const denied = results.filter((result) => !result.allowed);
  if (denied.length === 0) {
    return { allowed: true, retryAfterSeconds: 0 };
  }
  return {
    allowed: false,
    retryAfterSeconds: Math.max(
      ...denied.map((result) => result.retryAfterSeconds),
    ),
  };
}

export async function consumeContactRateLimitBuckets(
  buckets: ContactRateLimitBucket[],
): Promise<ContactRateLimitResult> {
  const supabase = createSupabaseAdminClient();
  const results = await Promise.all(
    buckets.map(async (bucket) => {
      const { data, error } = await supabase.rpc("consume_contact_rate_limit", {
        p_bucket_key: bucket.key,
        p_limit: bucket.limit,
        p_window_seconds: bucket.windowSeconds,
      });

      if (error) {
        throw new Error(`Contact rate limit check failed: ${error.message}`);
      }

      const row = Array.isArray(data) ? data[0] : null;
      if (!row) {
        throw new Error("Contact rate limit check returned no result");
      }

      return {
        allowed: row.allowed,
        retryAfterSeconds: Math.max(0, row.retry_after_seconds),
      };
    }),
  );

  return summarizeContactRateLimitResults(results);
}

function createBucketKey(scope: ContactRateLimitBucket["scope"], value: string) {
  return `${scope}:${createHash("sha256").update(value).digest("hex")}`;
}
