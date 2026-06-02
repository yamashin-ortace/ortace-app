export const ACCOUNT_STORAGE_USER_ID_KEY = "ortace.account.userId";
export const ACCOUNT_STORAGE_VERSION = "v3";
export const ACCOUNT_STORAGE_UNSCOPED_USER_ID = "unscoped";

declare global {
  interface Window {
    __ORTACE_ACCOUNT_USER_ID__?: string | null;
  }
}

export function createAccountStorageKey(
  baseKey: string,
  userId: string | null,
): string {
  return `${baseKey}:${ACCOUNT_STORAGE_VERSION}:${userId ?? ACCOUNT_STORAGE_UNSCOPED_USER_ID}`;
}

export function getAccountStorageUserId(): string | null {
  if (typeof window === "undefined") return null;
  return window.__ORTACE_ACCOUNT_USER_ID__ ?? null;
}

export function getAccountStorageKey(baseKey: string): string {
  return createAccountStorageKey(baseKey, getAccountStorageUserId());
}

export function isAccountStorageUser(userId: string): boolean {
  return getAccountStorageUserId() === userId;
}

export function isCurrentAccountStorageKey(
  key: string | null,
  baseKey: string,
): boolean {
  return key === null || key === getAccountStorageKey(baseKey);
}
