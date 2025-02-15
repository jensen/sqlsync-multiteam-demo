import { sql } from "@orbitinghail/sqlsync-worker";
import { Link, Outlet, useLocation, useParams } from "react-router";
import { ArrowLeft, CirclePlus } from "lucide-react";
import { useQuery } from "~/context/document.context";
import { RequireDocument } from "~/context/document.provider";

export default function ProjectSinglePage() {
  const { id } = useParams();

  const { rows: projects } = useQuery<{ name: string }>(
    sql`select name from projects where id = ${id}`
  );

  return (
    <RequireDocument>
      <div className="h-full flex flex-col">
        <div className="flex justify-between px-4 py-1 border-b border-zinc-800 hover:bg-zinc-900 cursor-default">
          <div className="text-zinc-200 flex items-center space-x-4">
            <Link
              to={
                useLocation().pathname.endsWith("issues")
                  ? `/projects`
                  : `/projects/${id}/issues`
              }
              className="text-zinc-400 hover:text-zinc-300"
            >
              <ArrowLeft size={20} />
            </Link>
            <span className="text-sm font-medium">
              {projects?.length !== 0 && projects && projects[0].name}
            </span>
          </div>
          <Link
            className="text-zinc-300 hover:text-zinc-50 hover:bg-zinc-800 p-2 rounded flex justify-center items-center space-x-1"
            to={`/projects/${id}/issues/new`}
            onClick={(event) => event.stopPropagation()}
          >
            <CirclePlus size={14} />
          </Link>
        </div>
        <Outlet />
      </div>
    </RequireDocument>
  );
}
