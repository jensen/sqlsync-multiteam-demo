import { useState, useRef } from "react";
import { clsx } from "clsx";
import { Send } from "lucide-react";

export interface CommentInputProps {
  onSubmit: (body: string) => void;
  placeholder?: string;
}

export default function CommentInput(props: CommentInputProps) {
  const { onSubmit, placeholder = "Add a comment..." } = props;
  const [body, setBody] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setBody("");
    if (textareaRef.current) {
      textareaRef.current.value = "";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-2">
      <textarea
        ref={textareaRef}
        role="textbox"
        className="w-full min-h-[80px] p-3 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-200 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-zinc-600"
        placeholder={placeholder}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className="flex justify-end">
        <button
          type="button"
          className={clsx(
            "px-4 py-1.5 text-sm rounded-md flex items-center gap-1.5",
            "bg-zinc-700 text-zinc-200 hover:bg-zinc-600",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          onClick={handleSubmit}
        >
          <Send className="w-3.5 h-3.5" />
          Add Comment
        </button>
      </div>
    </div>
  );
}
