import { useState, useEffect, useRef } from "react";
import { sql } from "@orbitinghail/sqlsync-worker";
import { Outlet, useParams } from "react-router";
import { useQuery } from "~/context/document.context";
import IssuesList from "../issues/components/list";

type Issue = {
  id: string;
  title: string;
  assignee: string;
  priority: number;
  status: "backlog" | "todo" | "inprogress" | "done" | "blocked" | "canceled";
  archived_at: string | null;
};

export default function IssueIndexPage() {
  const { filter } = useParams();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedSearch(search.trim()), 200);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [search]);

  const { rows: projects } = useQuery(sql`select id, name from projects`);

  const baseSelect = sql`
    select
      issues.id,
      title,
      users.name as assignee,
      priority,
      issues.created_by,
      status,
      archived_at,
      projects.name as project_name
    from issues
    left join users on users.id = issues.assigned_to
    left join projects on projects.id = issues.project_id
  `;

  const searchClause = debouncedSearch
    ? sql` and (title like ${"%" + debouncedSearch + "%"} or body like ${"%" + debouncedSearch + "%"})`
    : sql``;

  const { rows: issues } = useQuery<Issue>(
    filter === "active"
      ? sql`${baseSelect} where status != 'backlog' ${searchClause} order by issues.created_at desc`
      : filter === "backlog"
      ? sql`${baseSelect} where status = 'backlog' ${searchClause} order by issues.created_at desc`
      : debouncedSearch
      ? sql`${baseSelect} where (title like ${"%" + debouncedSearch + "%"} or body like ${"%" + debouncedSearch + "%"}) order by issues.created_at desc`
      : sql`${baseSelect} order by issues.created_at desc`
  );

  if (issues === undefined) return;

  return (
    <div className="flex-grow flex flex-col min-h-0">
      <IssuesList
        projects={projects}
        issues={issues}
        search={search}
        onSearchChange={setSearch}
      />
      <Outlet />
    </div>
  );
}