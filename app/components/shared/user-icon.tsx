import { convertNameToColor, initials } from "~/lib/string";
import { clsx } from "clsx";

interface UserIconProps {
  name: string;
}

export const userColors = [
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-yellow-500",
  "bg-lime-500",
  "bg-green-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-sky-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-purple-500",
  "bg-fuchsia-500",
  "bg-pink-500",
  "bg-rose-500",
];

export default function UserIcon(props) {
  return (
    <div
      className={clsx(
        "size-4 rounded-full flex items-center justify-center overflow-hidden",
        convertNameToColor(userColors, props.name)
      )}
    >
      <span className="text-xxs text-zinc-100">{initials(props.name)}</span>
    </div>
  );
}
