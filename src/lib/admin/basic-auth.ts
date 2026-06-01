const ADMIN_REALM = "ORT ACE Admin";

export function hasValidAdminBasicAuth(
  authorization: string | null,
): boolean {
  const expectedUser = process.env.ADMIN_BASIC_AUTH_USER;
  const expectedPassword = process.env.ADMIN_BASIC_AUTH_PASSWORD;
  if (!expectedUser || !expectedPassword || !authorization) return false;

  const [scheme, encoded] = authorization.split(" ", 2);
  if (scheme?.toLowerCase() !== "basic" || !encoded) return false;

  const decoded = decodeBase64(encoded);
  if (!decoded) return false;

  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex < 0) return false;

  return (
    constantTimeEqual(decoded.slice(0, separatorIndex), expectedUser) &&
    constantTimeEqual(decoded.slice(separatorIndex + 1), expectedPassword)
  );
}

export function createAdminBasicAuthChallenge(): Response {
  return new Response("Authentication required", {
    status: 401,
    headers: {
      "Cache-Control": "no-store",
      "WWW-Authenticate": `Basic realm="${ADMIN_REALM}", charset="UTF-8"`,
    },
  });
}

function decodeBase64(value: string): string | null {
  try {
    return atob(value);
  } catch {
    return null;
  }
}

function constantTimeEqual(actual: string, expected: string): boolean {
  const length = Math.max(actual.length, expected.length);
  let mismatch = actual.length ^ expected.length;

  for (let index = 0; index < length; index += 1) {
    mismatch |= (actual.charCodeAt(index) || 0) ^ (expected.charCodeAt(index) || 0);
  }

  return mismatch === 0;
}
