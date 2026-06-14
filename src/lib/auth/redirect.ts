export function normalizeAuthRedirectPath(
  value: string | null,
  origin: string,
): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";

  const decoded = decodePath(value);
  if (
    !decoded ||
    hasUnsafeRedirectCharacter(value) ||
    hasUnsafeRedirectCharacter(decoded)
  ) {
    return "/";
  }

  const url = new URL(decoded, origin);
  if (url.origin !== origin) return "/";

  return `${url.pathname}${url.search}${url.hash}`;
}

function decodePath(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function hasUnsafeRedirectCharacter(value: string): boolean {
  return /[\u0000-\u001f\u007f\s\\]/.test(value);
}
