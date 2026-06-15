import { useState, useEffect, useRef } from "react";
import { sql } from "@orbitinghail/sqlsync-worker";
import { Outlet, useParams } from "react-router";
import { useQuery } from "~/context/document.context";
import IssuesList from "../../issues/components/list";
import Breadcrumbs from "~/components/breadcrumbs";
import { useAuth } from "~/context/auth.context";

type Issue = {
  id: string;
  title: string;
  assignee: string;
  priority: number;
  status: "backlog" | "todo" | "inprogress" | "done" | "blocked" | "canceled";
  archived_at: string | null;
};

export default function ProjectIssueIndexPage() {
  const { auth } = useAuth();
  const { id, projectid } = useParams();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedSearch(search.trim()), 200);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [search]);

  const { rows: projects } = useQuery<{ id: string; name: string }>(
    sql`select id, name from projects`
  );

  const { rows: issues } = useQuery<Issue>(
    debouncedSearch
      ? sql`select
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
          where project_id = ${projectid}
            and (title like ${"%" + debouncedSearch + "%"} or body like ${"%" + debouncedSearch + "%"})`
      : sql`select
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
          where project_id = ${projectid}`
  );

  const organization = auth?.organizations.find(
    (organization) => organization.id === id
  );

  const project = projects?.find((project) => project.id === projectid);

  if (issues === undefined || projects === undefined) return;

  return (
    <div className="flex flex-col flex-grow">
      <div className="pr-4 border-b border-zinc-800 flex items-center justify-between">
        <Breadcrumbs team={organization} project={project} />
      </div>
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
