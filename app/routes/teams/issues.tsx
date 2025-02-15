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

  const { rows: projects } = useQuery(sql`select id, name from projects`);

  const { rows: issues } = useQuery<Issue>(
    filter === "active"
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
            where status != 'backlog'
            order by issues.created_at desc`
      : filter === "backlog"
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
            where status = 'backlog'
            order by issues.created_at desc`
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
            order by issues.created_at desc`
  );

  if (issues === undefined) return;

  return (
    <div className="flex-grow flex flex-col min-h-0">
      <IssuesList projects={projects} issues={issues} />
      <Outlet />
    </div>
  );
}
