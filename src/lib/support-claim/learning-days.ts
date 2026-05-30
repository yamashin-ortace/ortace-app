export function countLearningDaysFromAnsweredAts(
  answeredAts: readonly string[],
  now = new Date(),
  windowDays = 90,
): number {
  const start = new Date(now.getTime());
  start.setDate(start.getDate() - windowDays);
  const startTime = start.getTime();
  const endTime = now.getTime();
  const days = new Set<string>();

  for (const value of answeredAts) {
    const answeredAt = new Date(value);
    const time = answeredAt.getTime();
    if (!Number.isFinite(time) || time < startTime || time > endTime) continue;
    days.add(formatTokyoDate(answeredAt));
  }

  return days.size;
}

function formatTokyoDate(date: Date): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
