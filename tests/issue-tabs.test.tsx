import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Issue from "~/routes/issues/components/issue";
import type { Issue as IssueType, Comment, Activity } from "~/doctype";

const mockMutate = vi.fn();

vi.mock("~/context/document.context", () => ({
  useQuery: vi.fn(() => ({ state: "success" as const, rows: [] })),
  useMutate: vi.fn(() => mockMutate),
}));

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    Form: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) =>
      React.createElement("form", props, children),
  };
});

const makeIssue = (): IssueType & { body: string; project_id: string | null } => ({
  id: "i1",
  title: "Test Issue",
  body: "This is the issue body",
  assigned_to: "u1",
  priority: 1,
  status: "todo",
  archived_at: null,
  project_id: "p1",
});

const makeComment = (overrides?: Partial<Comment>): Comment => ({
  id: "c1",
  issue_id: "i1",
  body: "First comment body",
  created_by: "u1",
  created_at: "2024-01-15T10:30:00Z",
  ...overrides,
});

const makeActivity = (overrides?: Partial<Activity>): Activity => ({
  id: "a1",
  issue_id: "i1",
  actor_id: "u1",
  action: "status_changed",
  details: "backlog -> done",
  created_at: "2024-01-15T10:30:00Z",
  ...overrides,
});

describe("Issue detail page tabs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders tab navigation with Details, Comments, and Activity", () => {
    render(<Issue issue={makeIssue()} users={[{ id: "u1", name: "Alice" }]} />);

    expect(screen.getByText("Details")).toBeInTheDocument();
    expect(screen.getByText(/Comments/i)).toBeInTheDocument();
    expect(screen.getByText("Activity")).toBeInTheDocument();
  });

  test("shows issue details by default in the Details tab", () => {
    render(<Issue issue={makeIssue()} users={[{ id: "u1", name: "Alice" }]} />);

    expect(screen.getByText("Test Issue")).toBeInTheDocument();
    expect(screen.getByText("This is the issue body")).toBeInTheDocument();
  });

  test("clicking Comments tab shows comment list and input", () => {
    const comments = [makeComment()];
    render(
      <Issue
        issue={makeIssue()}
        users={[{ id: "u1", name: "Alice" }]}
        comments={comments}
      />
    );

    fireEvent.click(screen.getByText(/Comments/i));

    expect(screen.getByText("First comment body")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  test("clicking Activity tab shows activity feed", () => {
    const activities = [makeActivity()];
    render(
      <Issue
        issue={makeIssue()}
        users={[{ id: "u1", name: "Alice" }]}
        activities={activities}
      />
    );

    fireEvent.click(screen.getByText("Activity"));

    expect(screen.getByText(/status_changed/i)).toBeInTheDocument();
    expect(screen.getByText(/backlog -> done/i)).toBeInTheDocument();
  });

  test("switching tabs shows only the selected tab content", () => {
    const comments = [makeComment()];
    const activities = [makeActivity()];

    render(
      <Issue
        issue={makeIssue()}
        users={[{ id: "u1", name: "Alice" }]}
        comments={comments}
        activities={activities}
      />
    );

    // Default: Details shows title and body
    expect(screen.getByText("Test Issue")).toBeInTheDocument();
    expect(screen.getByText("This is the issue body")).toBeInTheDocument();
    expect(screen.queryByText("First comment body")).not.toBeInTheDocument();

    // Switch to Comments
    fireEvent.click(screen.getByText(/Comments/i));
    expect(screen.getByText("First comment body")).toBeInTheDocument();
    expect(screen.queryByText("Test Issue")).not.toBeInTheDocument();
    expect(screen.queryByText(/status_changed/i)).not.toBeInTheDocument();

    // Switch to Activity
    fireEvent.click(screen.getByText("Activity"));
    expect(screen.getByText(/status_changed/i)).toBeInTheDocument();
    expect(screen.queryByText("First comment body")).not.toBeInTheDocument();
    expect(screen.queryByText("Test Issue")).not.toBeInTheDocument();
  });

  test("Details tab is the default active tab", () => {
    render(<Issue issue={makeIssue()} users={[{ id: "u1", name: "Alice" }]} />);

    const detailsTab = screen.getByText("Details");
    expect(detailsTab).toBeInTheDocument();
  });

  test("Comments tab shows count when comments exist", () => {
    const comments = [makeComment(), makeComment({ id: "c2", body: "Second comment" })];
    render(
      <Issue
        issue={makeIssue()}
        users={[{ id: "u1", name: "Alice" }]}
        comments={comments}
      />
    );

    expect(screen.getByText("Comments (2)")).toBeInTheDocument();
  });

  test("Comments tab shows plain label when no comments", () => {
    render(<Issue issue={makeIssue()} users={[{ id: "u1", name: "Alice" }]} />);

    expect(screen.getByText("Comments")).toBeInTheDocument();
    expect(screen.queryByText(/Comments \(/)).not.toBeInTheDocument();
  });
});
