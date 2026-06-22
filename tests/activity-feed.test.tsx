import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ActivityFeed from "~/routes/issues/components/activity-feed";
import type { Activity } from "~/doctype";

describe("ActivityFeed", () => {
  const users = [
    { id: "u1", name: "Alice" },
    { id: "u2", name: "Bob" },
  ];

  // Use local date strings to match formatActivityDateKey's local-time todayKey/yesterdayKey
  const today = new Date().toLocaleDateString("en-CA");
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toLocaleDateString("en-CA");

  const makeActivities = (): Activity[] => [
    {
      id: "a1",
      issue_id: "i1",
      actor_id: "u1",
      action: "status_changed",
      details: "backlog -> done",
      created_at: `${today}T10:30:00Z`,
    },
    {
      id: "a2",
      issue_id: "i1",
      actor_id: "u2",
      action: "commented",
      details: null,
      created_at: `${today}T14:00:00Z`,
    },
    {
      id: "a3",
      issue_id: "i1",
      actor_id: "u1",
      action: "priority_changed",
      details: "low -> high",
      created_at: `${yesterday}T09:00:00Z`,
    },
  ];

  test("renders without crashing", () => {
    const { container } = render(
      <ActivityFeed activities={makeActivities()} users={users} />
    );
    expect(container).toBeTruthy();
  });

  test("renders date group headers", () => {
    render(<ActivityFeed activities={makeActivities()} users={users} />);
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Yesterday")).toBeInTheDocument();
  });

  test("renders each activity with actor name", () => {
    render(<ActivityFeed activities={makeActivities()} users={users} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  test("renders activity action text", () => {
    render(<ActivityFeed activities={makeActivities()} users={users} />);
    expect(screen.getByText(/status_changed/i)).toBeInTheDocument();
    expect(screen.getByText(/commented/i)).toBeInTheDocument();
    expect(screen.getByText(/priority_changed/i)).toBeInTheDocument();
  });

  test("renders activity details when present", () => {
    render(<ActivityFeed activities={makeActivities()} users={users} />);
    expect(screen.getByText(/backlog -> done/i)).toBeInTheDocument();
    expect(screen.getByText(/low -> high/i)).toBeInTheDocument();
  });

  test("handles empty activities array", () => {
    const { container } = render(<ActivityFeed activities={[]} users={users} />);
    expect(container.querySelectorAll("[data-activity-group]").length).toBe(0);
  });

  test("groups activities under correct date headers", () => {
    render(<ActivityFeed activities={makeActivities()} users={users} />);
    const todayHeader = screen.getByText("Today");
    const yesterdayHeader = screen.getByText("Yesterday");
    expect(todayHeader).toBeInTheDocument();
    expect(yesterdayHeader).toBeInTheDocument();
  });

  test("renders correct number of activity items", () => {
    const { container } = render(
      <ActivityFeed activities={makeActivities()} users={users} />
    );
    const items = container.querySelectorAll("[data-activity-item]");
    expect(items.length).toBe(3);
  });
});
