import { describe, test, expect } from "vitest";
import {
  groupActivitiesByDate,
  formatActivityDate,
  formatActivityDateKey,
  isToday,
  isYesterday,
} from "~/lib/date";

describe("groupActivitiesByDate", () => {
  test("groups items by their creation date", () => {
    const items = [
      { id: "a1", created_at: "2024-06-15T10:30:00Z" },
      { id: "a2", created_at: "2024-06-15T14:00:00Z" },
      { id: "a3", created_at: "2024-06-14T09:00:00Z" },
    ];

    const result = groupActivitiesByDate(items);

    expect(result).toHaveLength(2);
    expect(result[0][0]).toBe("2024-06-15");
    expect(result[0][1]).toHaveLength(2);
    expect(result[0][1][0].id).toBe("a1");
    expect(result[0][1][1].id).toBe("a2");
    expect(result[1][0]).toBe("2024-06-14");
    expect(result[1][1]).toHaveLength(1);
    expect(result[1][1][0].id).toBe("a3");
  });

  test("returns dates in descending order (newest first)", () => {
    const items = [
      { id: "a1", created_at: "2024-06-10T00:00:00Z" },
      { id: "a2", created_at: "2024-06-20T00:00:00Z" },
      { id: "a3", created_at: "2024-06-15T00:00:00Z" },
    ];

    const result = groupActivitiesByDate(items);
    const dates = result.map(([date]) => date);
    expect(dates).toEqual(["2024-06-20", "2024-06-15", "2024-06-10"]);
  });

  test("returns empty array when no items provided", () => {
    const result = groupActivitiesByDate([]);
    expect(result).toEqual([]);
  });

  test("includes all items from the same date in one group", () => {
    const items = [
      { id: "a1", created_at: "2024-06-15T08:00:00Z" },
      { id: "a2", created_at: "2024-06-15T12:00:00Z" },
      { id: "a3", created_at: "2024-06-15T10:00:00Z" },
    ];

    const result = groupActivitiesByDate(items);
    expect(result).toHaveLength(1);
    expect(result[0][1]).toHaveLength(3);
    const ids = result[0][1].map((a) => a.id);
    expect(ids).toContain("a1");
    expect(ids).toContain("a2");
    expect(ids).toContain("a3");
  });
});

describe("formatActivityDate", () => {
  test("returns 'Today' for today's date", () => {
    const today = new Date().toISOString();
    expect(formatActivityDate(today)).toBe("Today");
  });

  test("returns 'Yesterday' for yesterday's date", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(formatActivityDate(yesterday.toISOString())).toBe("Yesterday");
  });

  test("returns formatted date for older dates", () => {
    const result = formatActivityDate("2024-06-10T00:00:00Z");
    expect(result).not.toBe("Today");
    expect(result).not.toBe("Yesterday");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("formatActivityDateKey", () => {
  test("returns 'Today' for today's date key", () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(formatActivityDateKey(today)).toBe("Today");
  });

  test("returns 'Yesterday' for yesterday's date key", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(formatActivityDateKey(yesterday.toISOString().slice(0, 10))).toBe("Yesterday");
  });

  test("returns formatted date for older date keys", () => {
    const result = formatActivityDateKey("2024-06-10");
    expect(result).not.toBe("Today");
    expect(result).not.toBe("Yesterday");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("isToday", () => {
  test("returns true for today's date", () => {
    expect(isToday(new Date())).toBe(true);
  });

  test("returns true for today's ISO string", () => {
    expect(isToday(new Date().toISOString())).toBe(true);
  });

  test("returns false for yesterday's date", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isToday(yesterday)).toBe(false);
  });

  test("returns false for older dates", () => {
    expect(isToday("2024-01-01T00:00:00Z")).toBe(false);
  });
});

describe("isYesterday", () => {
  test("returns true for yesterday's date", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isYesterday(yesterday)).toBe(true);
  });

  test("returns false for today's date", () => {
    expect(isYesterday(new Date())).toBe(false);
  });

  test("returns false for older dates", () => {
    expect(isYesterday("2024-01-01T00:00:00Z")).toBe(false);
  });
});
