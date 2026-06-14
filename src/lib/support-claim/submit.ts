export function getSupportClaimEligibilityLearningDays({
  databaseLearningDays,
}: {
  databaseLearningDays: number;
  clientLearningDays?: number;
}): number {
  return databaseLearningDays;
}
