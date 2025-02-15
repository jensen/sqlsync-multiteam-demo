import { Link, useMatch } from "react-router";
import { CirclePlus, PackagePlus } from "lucide-react";

export default function ProjectsHeader() {
  const match = useMatch("/teams/*");

  return (
    <div className="px-8 py-2 flex justify-end border-b border-zinc-800">
      <Link
        className="text-zinc-300 hover:text-zinc-50 hover:bg-zinc-800 py-1 pl-3 pr-4 rounded flex justify-center items-center space-x-1"
        to={match ? `${match.pathname}/new` : "/projects/new"}
        onClick={(event) => event.stopPropagation()}
      >
        <PackagePlus size={14} />
        <span className="text-sm">Create project</span>
      </Link>
    </div>
  );
}
