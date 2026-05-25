import type { User } from "@supabase/supabase-js";
import { getEffectivePlan } from "@/lib/billing/plans";
import type { ProfilesRow } from "@/lib/supabase/database.types";

export const TRIAL_DURATION_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

export type TrialAuthProvider = "google" | "line" | "email" | "unknown";

export type TrialState = {
  startedAt: string | null;
  endsAt: string | null;
  usedAt: string | null;
  isActive: boolean;
  hasEnded: boolean;
  hasUsed: boolean;
  canStartBase: boolean;
  authProviderAllowed: boolean;
  canStart: boolean;
  remainingDays: number;
};

export function getTrialState(
  profile: Pick<
    ProfilesRow,
    | "plan"
    | "plan_status"
    | "plan_expires_at"
    | "trial_started_at"
    | "trial_ends_at"
    | "trial_used_at"
  >,
  now = new Date(),
  authProviderAllowed = true,
): TrialState {
  const startedAt = profile.trial_started_at;
  const endsAt = profile.trial_ends_at;
  const usedAt = profile.trial_used_at;
  const remainingDays = getTrialRemainingDays(endsAt, now);
  const isActive = Boolean(usedAt && endsAt && remainingDays > 0);
  const hasEnded = Boolean(usedAt && endsAt && !isActive);
  const hasUsed = Boolean(usedAt);
  const effectivePaidPlan = getEffectivePlan({
    plan: profile.plan,
    status: profile.plan_status,
    expiresAt: profile.plan_expires_at,
    now,
  });
  const canStartBase = effectivePaidPlan === "free" && !hasUsed && !isActive;

  return {
    startedAt,
    endsAt,
    usedAt,
    isActive,
    hasEnded,
    hasUsed,
    canStartBase,
    authProviderAllowed,
    canStart: canStartBase && authProviderAllowed,
    remainingDays,
  };
}

export function calculateTrialEndsAt(startedAt = new Date()): string {
  return new Date(startedAt.getTime() + TRIAL_DURATION_DAYS * DAY_MS).toISOString();
}

export function getTrialRemainingDays(
  endsAt: string | null,
  now = new Date(),
): number {
  if (!endsAt) return 0;
  const diff = new Date(endsAt).getTime() - now.getTime();
  if (!Number.isFinite(diff) || diff <= 0) return 0;
  return Math.ceil(diff / DAY_MS);
}

export function getTrialAuthProvider(user: Pick<User, "app_metadata" | "identities">): TrialAuthProvider {
  const providers = collectAuthProviders(user);
  if (providers.some(isGoogleProvider)) return "google";
  if (providers.some(isLineProvider)) return "line";
  if (providers.some((provider) => provider === "email")) return "email";
  return "unknown";
}

export function isTrialEligibleAuthProvider(
  provider: TrialAuthProvider,
): boolean {
  return provider === "google" || provider === "line";
}

export function isTrialEligibleAuthUser(
  user: Pick<User, "app_metadata" | "identities">,
): boolean {
  return isTrialEligibleAuthProvider(getTrialAuthProvider(user));
}

function collectAuthProviders(
  user: Pick<User, "app_metadata" | "identities">,
): string[] {
  const rawProviders = [
    user.app_metadata.provider,
    ...(Array.isArray(user.app_metadata.providers)
      ? user.app_metadata.providers
      : []),
    ...(user.identities ?? []).map((identity) => identity.provider),
  ];

  return rawProviders
    .filter((provider): provider is string => typeof provider === "string")
    .map((provider) => provider.toLowerCase());
}

function isGoogleProvider(provider: string): boolean {
  return provider === "google";
}

function isLineProvider(provider: string): boolean {
  return provider === "line" || provider.startsWith("custom:line");
}
