import { clsx } from "clsx";
import { PropsWithChildren, type ButtonHTMLAttributes } from "react";
import { UserSquareIcon } from "lucide-react";
import { convertNameToColor } from "~/lib/string";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

const cxButton = clsx(
  "space-x-2 min-w-32",
  "text-sm font-medium px-6 py-1.5 rounded",
  "shadow-button select-none"
);

export function PrimaryButton(props: ButtonProps) {
  return (
    <button
      {...props}
      className={clsx(
        cxButton,
        "bg-violet-800 hover:bg-violet-900 active:bg-violet-950",
        "text-zinc-50 hover:text-zinc-100 active:text-zinc-200"
      )}
    >
      {props.children}
    </button>
  );
}

export function OutlineButton(props: ButtonProps) {
  return (
    <button
      {...props}
      className={clsx(
        cxButton,
        "bg-transparent hover:bg-zinc-800 active:bg-zinc-950",
        "text-zinc-50 hover:text-zinc-100 active:text-zinc-200"
      )}
    >
      {props.children}
    </button>
  );
}

export function DangerButton(props: ButtonProps) {
  return (
    <button
      {...props}
      className={clsx(
        cxButton,
        "bg-red-800 hover:bg-red-900 active:bg-red-950",
        "text-zinc-50 hover:text-zinc-100 active:text-zinc-200"
      )}
    >
      {props.children}
    </button>
  );
}

export function LightButton(props: ButtonProps) {
  return (
    <button
      {...props}
      className={clsx(
        "shadow-[inset_0px_1px_1px_rgba(255,255,255,1),inset_0px_-2px_1px_rgba(0,0,0,0.1),0px_2px_25px_rgba(0,0,0,0.2)]",
        "active:shadow-[inset_0px_1px_1px_rgba(255,255,255,1),inset_0px_0px_1px_rgba(0,0,0,0.1),0px_2px_12px_rgba(0,0,0,0.2)]",
        "text-neutral-900 h-8 rounded-2xl bg-neutral-50 px-10 flex items-center"
      )}
    >
      <span className="text-sm font-medium">{props.children}</span>
    </button>
  );
}

const teamColors = [
  "bg-red-600 group-hover:bg-red-500",
  "bg-orange-600 group-hover:bg-orange-500",
  "bg-amber-600 group-hover:bg-amber-500",
  "bg-yellow-600 group-hover:bg-yellow-500",
  "bg-lime-600 group-hover:bg-lime-500",
  "bg-green-600 group-hover:bg-green-500",
  "bg-emerald-600 group-hover:bg-emerald-500",
  "bg-teal-600 group-hover:bg-teal-500",
  "bg-cyan-600 group-hover:bg-cyan-500",
  "bg-sky-600 group-hover:bg-sky-500",
  "bg-blue-600 group-hover:bg-blue-500",
  "bg-indigo-600 group-hover:bg-indigo-500",
  "bg-violet-600 group-hover:bg-violet-500",
  "bg-purple-600 group-hover:bg-purple-500",
  "bg-fuchsia-600 group-hover:bg-fuchsia-500",
  "bg-pink-600 group-hover:bg-pink-500",
  "bg-rose-600 group-hover:bg-rose-500",
];

export function TeamIcon(props) {
  return (
    <div
      className={clsx(
        convertNameToColor(teamColors, props.name),
        "size-3.5 rounded-sm text-zinc-900 group-hover:text-zinc-800 flex items-center justify-center"
      )}
    >
      <UserSquareIcon size={12} />
    </div>
  );
}

export function TeamButton(props: PropsWithChildren<ButtonProps>) {
  return (
    <button
      {...props}
      className="w-full py-1 group flex items-center space-x-2 text-zinc-300 hover:text-zinc-100"
    >
      <TeamIcon name={props.children} />
      <span className="text-sm font-medium select-none">{props.children}</span>
    </button>
  );
}
