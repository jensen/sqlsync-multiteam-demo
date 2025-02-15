import { clsx } from "clsx";
import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const TextInput = forwardRef<HTMLInputElement, InputProps>(
  function TextInput(props, ref) {
    return (
      <input
        ref={ref}
        type="text"
        {...props}
        className={clsx(
          "h-7 w-full px-0.5 py-2",
          "bg-transparent outline-none",
          "font-normal text-sm text-zinc-50 placeholder-zinc-400",
          "border-b border-zinc-700/50"
        )}
      />
    );
  }
);
