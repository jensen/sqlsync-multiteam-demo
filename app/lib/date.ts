/**
 * Date utility functions for activity feed grouping and formatting.
 */

/**
 * Extracts YYYY-MM-DD from a date string, handling both ISO and YYYY-MM-DD formats.
 */
function extractDateKey(date: Date | string): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns today's date as YYYY-MM-DD in local time.
 */
function todayKey(): string {
  return extractDateKey(new Date());
}

/**
 * Returns yesterday's date as YYYY-MM-DD in local time.
 */
function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return extractDateKey(d);
}

/**
 * Groups activities/items by their creation date (YYYY-MM-DD).
 * Returns an array of [date, items] tuples sorted in descending date order (newest first).
 */
export function groupActivitiesByDate<T extends { created_at: string }>(
  items: T[]
): [string, T[]][] {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const dateKey = item.created_at.slice(0, 10); // YYYY-MM-DD
    const existing = groups.get(dateKey);
    if (existing) {
      existing.push(item);
    } else {
      groups.set(dateKey, [item]);
    }
  }

  // Sort by date descending (newest first)
  const sorted = Array.from(groups.entries()).sort(
    ([dateA], [dateB]) => (dateB > dateA ? 1 : -1)
  );

  return sorted;
}

/**
 * Checks if a given date is today.
 */
export function isToday(date: Date | string): boolean {
  return extractDateKey(date) === todayKey();
}

/**
 * Checks if a given date is yesterday.
 */
export function isYesterday(date: Date | string): boolean {
  return extractDateKey(date) === yesterdayKey();
}

/**
 * Formats an ISO date string as a human-readable label.
 * Returns "Today" for the current date, "Yesterday" for the previous date,
 * or a formatted date string for older dates.
 */
export function formatActivityDate(date: string): string {
  if (isToday(date)) {
    return "Today";
  }
  if (isYesterday(date)) {
    return "Yesterday";
  }
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Formats a YYYY-MM-DD date key as a human-readable label.
 * Compares the key directly against today/yesterday keys to avoid timezone issues.
 */
export function formatActivityDateKey(dateKey: string): string {
  if (dateKey === todayKey()) {
    return "Today";
  }
  if (dateKey === yesterdayKey()) {
    return "Yesterday";
  }
  const d = new Date(dateKey + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
