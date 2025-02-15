import { Outlet, useParams } from "react-router";
import Breadcrumbs from "~/components/breadcrumbs";
import { useQuery } from "~/context/document.context";
import { sql } from "@orbitinghail/sqlsync-worker";
import { useAuth } from "~/context/auth.context";

export default function TeamSinglePage() {
  const { auth } = useAuth();
  const { issueid } = useParams();

  const { rows: issues } = useQuery<{ id: string; title: string }>(
    sql`select id, title from issues where id = ${issueid}`
  );

  if (issueid && issues.length === 0) {
    return null;
  }

  const team = auth?.organizations.find(
    ({ document }) => document === issues[0]?.document
  );

  const issue = issues.find(({ id }) => id === issueid);

  return (
    <>
      <div className="border-b border-zinc-800 flex items-center justify-between">
        <Breadcrumbs
          rootLabel="My issues"
          team={team}
          issue={issue}
          mutate={issue?.mutate}
        />
      </div>
      <Outlet />
    </>
  );
}
