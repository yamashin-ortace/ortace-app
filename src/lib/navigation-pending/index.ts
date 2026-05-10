export const NAVIGATION_PENDING_EVENT = "ortace:navigation-start";

export function startNavigationPending(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(NAVIGATION_PENDING_EVENT));
}
