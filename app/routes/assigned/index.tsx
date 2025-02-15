import { Navigate, Outlet } from "react-router";
import { sql } from "@orbitinghail/sqlsync-worker";
import { useQuery } from "~/context/document.context";
import IssueList from "../issues/components/list";
import { useAuth } from "~/context/auth.context";

type Issue = {
  id: string;
  title: string;
  assignee: string;
  priority: number;
  status: "backlog" | "todo" | "inprogress" | "done" | "blocked" | "canceled";
  archived_at: string | null;
};

export default function AssignedIssuesPage() {
  const { auth } = useAuth();

  const { rows: projects } = useQuery(sql`select id, name from projects`);

  const { rows: issues, state } = useQuery<Issue>(sql`select
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
    where issues.assigned_to = ${auth?.id}
    order by
      case
        when status = 'inprogress' then 1
        when status = 'todo' then 2
        when status = 'blocked' then 3
        when status = 'done' then 4
        when status = 'backlog' then 5
        when status = 'canceled' then 6
        else 7
      end, priority desc, issues.created_at desc
  `);

  if (auth && auth.organizations.length === 0) {
    return <Navigate to="/teams" />;
  }

  if (state === "pending") return null;

  return (
    <div className="flex-grow flex flex-col min-h-0">
      <IssueList projects={projects} issues={issues} />
      <Outlet />
    </div>
  );
}
