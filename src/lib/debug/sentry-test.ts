export function isSentryTestRouteEnabled(
  nodeEnv: string | undefined,
  token: string | undefined,
): boolean {
  return nodeEnv !== "production" && Boolean(token);
}
