import React from "react";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import IssueList from "~/routes/issues/components/list";
import type { Issue } from "~/doctype";

const mockMutate = vi.fn();

vi.mock("~/context/document.context", () => ({
  useQuery: vi.fn(() => ({ state: "success" as const, rows: [] })),
  useMutate: vi.fn(() => mockMutate),
}));

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    useParams: vi.fn(() => ({})),
    Link: ({ children, to, ...props }: { children: React.ReactNode; to: string; [key: string]: unknown }) =>
      React.createElement("a", { href: to, ...props }, children),
  };
});

const makeIssue = (overrides?: Partial<Issue>): Issue => ({
  id: "i1",
  title: "Test Issue",
  body: "This is a test issue with some content",
  assigned_to: "u1",
  priority: 1,
  status: "todo",
  archived_at: null,
  project_id: null,
  project_name: null,
  created_at: "2024-01-15T10:30:00Z",
  ...overrides,
});

describe("IssueList search functionality", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("does NOT render search input when onSearchChange is not provided", () => {
    const issues = [makeIssue()];
    render(<IssueList issues={issues} selected={[]} setSelected={vi.fn()} />);

    expect(screen.queryByPlaceholderText("Search issues...")).not.toBeInTheDocument();
  });

  test("renders search input when onSearchChange is provided", () => {
    const issues = [makeIssue()];
    const onSearchChange = vi.fn();
    render(
      <IssueList
        issues={issues}
        selected={[]}
        setSelected={vi.fn()}
        search=""
        onSearchChange={onSearchChange}
      />
    );

    expect(screen.getByPlaceholderText("Search issues...")).toBeInTheDocument();
  });

  test("search input has correct placeholder and initial value", () => {
    const issues = [makeIssue()];
    const onSearchChange = vi.fn();
    render(
      <IssueList
        issues={issues}
        selected={[]}
        setSelected={vi.fn()}
        search=""
        onSearchChange={onSearchChange}
      />
    );

    const searchInput = screen.getByPlaceholderText("Search issues...");
    expect(searchInput).toHaveValue("");
  });

  test("clear button (×) appears when search input has text", () => {
    const issues = [makeIssue()];
    const onSearchChange = vi.fn();
    render(
      <IssueList
        issues={issues}
        selected={[]}
        setSelected={vi.fn()}
        search="test"
        onSearchChange={onSearchChange}
      />
    );

    // Clear button should be present when there's text
    const clearButton = screen.getByRole("button", { name: /clear/i });
    expect(clearButton).toBeInTheDocument();
  });

  test("clear button does NOT appear when search input is empty", () => {
    const issues = [makeIssue()];
    const onSearchChange = vi.fn();
    render(
      <IssueList
        issues={issues}
        selected={[]}
        setSelected={vi.fn()}
        search=""
        onSearchChange={onSearchChange}
      />
    );

    // Clear button should NOT be present when empty
    expect(screen.queryByRole("button", { name: /clear/i })).not.toBeInTheDocument();
  });

  test("typing in search input calls onSearchChange with debounced value", async () => {
    vi.useFakeTimers();
    const issues = [makeIssue()];
    const onSearchChange = vi.fn();
    render(
      <IssueList
        issues={issues}
        selected={[]}
        setSelected={vi.fn()}
        search=""
        onSearchChange={onSearchChange}
      />
    );

    const searchInput = screen.getByPlaceholderText("Search issues...");

    // Type some text
    fireEvent.change(searchInput, { target: { value: "bug" } });

    // Immediately after typing, onSearchChange should NOT be called yet (debouncing)
    expect(onSearchChange).not.toHaveBeenCalled();

    // Fast-forward time by 200ms (debounce delay)
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    // Now onSearchChange should have been called with the search term
    expect(onSearchChange).toHaveBeenCalledWith("bug");
  });

  test("clearing search calls onSearchChange with empty string", async () => {
    vi.useFakeTimers();
    const issues = [makeIssue()];
    const onSearchChange = vi.fn();
    render(
      <IssueList
        issues={issues}
        selected={[]}
        setSelected={vi.fn()}
        search="bug"
        onSearchChange={onSearchChange}
      />
    );

    const clearButton = screen.getByRole("button", { name: /clear/i });
    fireEvent.click(clearButton);

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(onSearchChange).toHaveBeenCalledWith("");
  });

  test("rapid typing only triggers the last value after debounce", async () => {
    vi.useFakeTimers();
    const issues = [makeIssue()];
    const onSearchChange = vi.fn();
    render(
      <IssueList
        issues={issues}
        selected={[]}
        setSelected={vi.fn()}
        search=""
        onSearchChange={onSearchChange}
      />
    );

    const searchInput = screen.getByPlaceholderText("Search issues...");

    // Type rapidly: "b", "bu", "bug"
    fireEvent.change(searchInput, { target: { value: "b" } });
    fireEvent.change(searchInput, { target: { value: "bu" } });
    fireEvent.change(searchInput, { target: { value: "bug" } });

    // No calls yet due to debouncing
    expect(onSearchChange).not.toHaveBeenCalled();

    // Advance past debounce
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    // Should only call with final value
    expect(onSearchChange).toHaveBeenCalledTimes(1);
    expect(onSearchChange).toHaveBeenCalledWith("bug");
  });
});
