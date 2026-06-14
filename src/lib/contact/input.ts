export function sanitizeContactHeaderText(
  value: unknown,
  maxLength: number,
): string {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}
