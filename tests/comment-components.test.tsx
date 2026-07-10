import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CommentList from "~/routes/issues/components/comment-list";
import CommentInput from "~/routes/issues/components/comment-input";
import CommentItem from "~/routes/issues/components/comment-item";
import type { Comment } from "~/doctype";

const makeComment = (overrides?: Partial<Comment>): Comment => ({
  id: "c1",
  issue_id: "i1",
  body: "This is a test comment",
  created_by: "u1",
  created_at: "2024-01-15T10:30:00Z",
  ...overrides,
});

describe("CommentList", () => {
  test("renders all comments", () => {
    const comments = [
      makeComment({ id: "c1", body: "Alpha" }),
      makeComment({ id: "c2", body: "Beta" }),
    ];
    render(<CommentList comments={comments} />);

    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  test("passes user names from userMap to comment items", () => {
    const comments = [makeComment({ id: "c1", created_by: "u1" })];
    render(<CommentList comments={comments} userMap={{ u1: "Alice" }} />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  test("calls onEditComment when a comment is edited", () => {
    const onEditComment = vi.fn();
    const comments = [makeComment({ id: "c1", body: "Original" })];
    render(
      <CommentList
        comments={comments}
        userMap={{ u1: "Alice" }}
        onEditComment={onEditComment}
      />
    );

    const editBtn = screen.getByLabelText("Edit");
    fireEvent.click(editBtn);

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Changed" } });

    const saveBtn = screen.getByText("Save");
    fireEvent.click(saveBtn);

    expect(onEditComment).toHaveBeenCalledTimes(1);
    expect(onEditComment).toHaveBeenCalledWith("c1", "Changed");
  });

  test("calls onDeleteComment when a comment is deleted", () => {
    const onDeleteComment = vi.fn();
    const comments = [makeComment({ id: "c1" })];
    render(
      <CommentList
        comments={comments}
        userMap={{ u1: "Alice" }}
        onDeleteComment={onDeleteComment}
      />
    );

    const deleteBtn = screen.getByLabelText("Delete");
    fireEvent.click(deleteBtn);

    expect(onDeleteComment).toHaveBeenCalledTimes(1);
    expect(onDeleteComment).toHaveBeenCalledWith("c1");
  });

  test("renders empty state message when comments array is empty", () => {
    render(<CommentList comments={[]} />);
    expect(screen.getByText(/no comments yet/i)).toBeInTheDocument();
  });

  test("uses custom renderComment when provided", () => {
    const comments = [makeComment({ id: "c1", body: "Hidden" })];
    render(
      <CommentList
        comments={comments}
        renderComment={(comment) => <div data-testid="custom">{comment.id}</div>}
      />
    );

    expect(screen.getByTestId("custom")).toHaveTextContent("c1");
  });
});

describe("CommentInput", () => {
  test("renders a textarea", () => {
    render(<CommentInput onSubmit={vi.fn()} />);
    const input = screen.getByRole("textbox");
    expect(input).toBeInTheDocument();
  });

  test("uses custom placeholder when provided", () => {
    render(<CommentInput onSubmit={vi.fn()} placeholder="Write a comment…" />);
    expect(screen.getByPlaceholderText("Write a comment…")).toBeInTheDocument();
  });

  test("calls onSubmit with body when submitted", () => {
    const onSubmit = vi.fn();
    render(<CommentInput onSubmit={onSubmit} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Hello world" } });

    const submitBtn = screen.getByText("Add Comment");
    fireEvent.click(submitBtn);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith("Hello world");
  });

  test("clears input after successful submit", () => {
    render(<CommentInput onSubmit={vi.fn()} />);

    const input = screen.getByRole("textbox") as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: "Hello world" } });
    expect(input.value).toBe("Hello world");

    const submitBtn = screen.getByText("Add Comment");
    fireEvent.click(submitBtn);

    expect(input.value).toBe("");
  });

  test("does not submit empty body", () => {
    const onSubmit = vi.fn();
    render(<CommentInput onSubmit={onSubmit} />);

    const submitBtn = screen.getByText("Add Comment");
    fireEvent.click(submitBtn);

    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("allows submitting via keyboard enter", () => {
    const onSubmit = vi.fn();
    render(<CommentInput onSubmit={onSubmit} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Keyboard submit" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith("Keyboard submit");
  });
});

describe("CommentItem", () => {
  test("renders comment body", () => {
    render(<CommentItem comment={makeComment()} />);
    expect(screen.getByText("This is a test comment")).toBeInTheDocument();
  });

  test("renders user name when provided", () => {
    render(<CommentItem comment={makeComment()} userName="Alice" />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  test("renders created_at timestamp", () => {
    render(<CommentItem comment={makeComment()} />);
    const timeElement = screen.getByRole("time");
    expect(timeElement).toBeInTheDocument();
  });

  test("calls onDelete when delete action is triggered", () => {
    const onDelete = vi.fn();
    render(<CommentItem comment={makeComment()} onDelete={onDelete} />);

    const deleteBtn = screen.getByLabelText("Delete");
    fireEvent.click(deleteBtn);

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith("c1");
  });

  test("calls onEdit when edit action is triggered with new body", () => {
    const onEdit = vi.fn();
    render(<CommentItem comment={makeComment()} onEdit={onEdit} />);

    const editBtn = screen.getByLabelText("Edit");
    fireEvent.click(editBtn);

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Updated body" } });

    const saveBtn = screen.getByText("Save");
    fireEvent.click(saveBtn);

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith("c1", "Updated body");
  });

  test("shows delete button when onDelete is provided", () => {
    render(<CommentItem comment={makeComment()} onDelete={vi.fn()} />);
    expect(screen.getByLabelText("Delete")).toBeInTheDocument();
  });

  test("shows edit button when onEdit is provided", () => {
    render(<CommentItem comment={makeComment()} onEdit={vi.fn()} />);
    expect(screen.getByLabelText("Edit")).toBeInTheDocument();
  });

  test("cancel edit restores original body", () => {
    render(<CommentItem comment={makeComment()} onEdit={vi.fn()} />);

    const editBtn = screen.getByLabelText("Edit");
    fireEvent.click(editBtn);

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Changed" } });

    const cancelBtn = screen.getByText("Cancel");
    fireEvent.click(cancelBtn);

    expect(screen.getByText("This is a test comment")).toBeInTheDocument();
  });
});
