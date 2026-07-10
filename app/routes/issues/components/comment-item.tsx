import { useState } from "react";
import { clsx } from "clsx";
import { Edit2, Trash2, Save, X } from "lucide-react";
import type { Comment } from "~/doctype";
import UserIcon from "~/components/shared/user-icon";

export interface CommentItemProps {
  comment: Comment;
  userName?: string;
  onEdit?: (id: string, body: string) => void;
  onDelete?: (id: string) => void;
}

export default function CommentItem(props: CommentItemProps) {
  const { comment, userName, onEdit, onDelete } = props;
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);

  const displayName = userName ?? comment.created_by;

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(comment.created_at));

  const handleSave = () => {
    if (editBody.trim()) {
      onEdit?.(comment.id, editBody);
      setEditing(false);
    }
  };

  const handleCancel = () => {
    setEditBody(comment.body);
    setEditing(false);
  };

  return (
    <div className="flex gap-3 py-4 border-b border-zinc-800 last:border-b-0">
      <UserIcon name={displayName} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-zinc-200">
            {displayName}
          </span>
          <time className="text-xs text-zinc-500">{formattedDate}</time>
        </div>

        {editing ? (
          <div className="space-y-2">
            <textarea
              role="textbox"
              className="w-full min-h-[80px] p-2 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-200 text-sm resize-y"
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                type="button"
                className="px-3 py-1 text-xs rounded-md bg-zinc-700 text-zinc-200 hover:bg-zinc-600 flex items-center gap-1"
                onClick={handleSave}
              >
                <Save className="w-3 h-3" />
                Save
              </button>
              <button
                type="button"
                className="px-3 py-1 text-xs rounded-md bg-zinc-800 text-zinc-400 hover:bg-zinc-700 flex items-center gap-1"
                onClick={handleCancel}
              >
                <X className="w-3 h-3" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-300 whitespace-pre-wrap">
            {comment.body}
          </p>
        )}

        {!editing && (onEdit || onDelete) && (
          <div className="flex gap-2 mt-2">
            {onEdit && (
              <button
                type="button"
                className="p-1 text-zinc-500 hover:text-zinc-300"
                aria-label="Edit"
                onClick={() => {
                  setEditBody(comment.body);
                  setEditing(true);
                }}
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="p-1 text-zinc-500 hover:text-red-400"
                aria-label="Delete"
                onClick={() => onDelete(comment.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
