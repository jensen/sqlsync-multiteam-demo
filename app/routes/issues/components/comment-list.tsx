import type { Comment } from "~/doctype";
import type { ReactNode } from "react";
import CommentItem from "./comment-item";

export interface CommentListProps {
  comments: Comment[];
  userMap?: Record<string, string>;
  onEditComment?: (id: string, body: string) => void;
  onDeleteComment?: (id: string) => void;
  renderComment?: (comment: Comment, userName: string | undefined) => ReactNode;
}

export default function CommentList(props: CommentListProps) {
  const { comments, userMap, onEditComment, onDeleteComment, renderComment } =
    props;

  if (comments.length === 0) {
    return (
      <div className="py-8 text-center text-zinc-500 text-sm">
        No comments yet
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-800">
      {comments.map((comment) => {
        const userName = userMap?.[comment.created_by];

        if (renderComment) {
          return renderComment(comment, userName);
        }

        return (
          <CommentItem
            key={comment.id}
            comment={comment}
            userName={userName}
            onEdit={onEditComment}
            onDelete={onDeleteComment}
          />
        );
      })}
    </div>
  );
}
