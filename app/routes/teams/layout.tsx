import { Link, useParams, Outlet } from "react-router";
import { CirclePlus } from "lucide-react";
import Breadcrumbs from "~/components/breadcrumbs";
import { useAuth } from "~/context/auth.context";
import { useMutate, useQuery } from "~/context/document.context";
import { sql } from "@orbitinghail/sqlsync-worker";

export default function TeamLayout() {
  const { auth } = useAuth();
  const { teamid, issueid, filter } = useParams();

  const mutate = useMutate();

  const organization = auth?.organizations.find(
    (organization) => organization.id === teamid
  );

  const { rows: issues } = useQuery<{ id: string; title: string }>(
    sql`select id, title from issues where id = ${issueid}`
  );

  const issue = issues && issues.length > 0 && issues[0];

  return (
    <>
      <div className="pr-4 border-b border-zinc-800 flex items-center justify-between">
        <Breadcrumbs team={organization} issue={issue} mutate={mutate} />
        {filter && (
          <Link
            className="text-zinc-300 hover:text-zinc-50 hover:bg-zinc-800 py-1 pl-3 pr-4 rounded flex justify-center items-center space-x-1"
            to={`issues/${filter}/new`}
            onClick={(event) => event.stopPropagation()}
          >
            <CirclePlus size={14} />
            <span className="text-sm">Create issue</span>
          </Link>
        )}
      </div>
      <Outlet />
    </>
  );
}
