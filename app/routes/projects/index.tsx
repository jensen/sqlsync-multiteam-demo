import { Outlet, Navigate } from "react-router";
import { sql } from "@orbitinghail/sqlsync-worker";
import { useQuery } from "~/context/document.context";
import ProjectsList from "./components/list";
import { useAuth } from "~/context/auth.context";

export default function ProjectIndexPage() {
  const { auth } = useAuth();

  const { rows: projects } = useQuery<{ id: string; name: string }>(
    sql`select
      projects.id,
      projects.name,
      count(issues.id) as total,
      sum(case when issues.status = 'backlog' then 1 else 0 end) as backlog_count,
      sum(case when issues.status = 'todo' or issues.status = 'inprogress' then 1 else 0 end) as active_count,
      sum(case when issues.status = 'done' then 1 else 0 end) as done_count,
      sum(case when issues.status = 'blocked' then 1 else 0 end) as blocked_count,
      sum(case when issues.status = 'canceled' then 1 else 0 end) as canceled_count
    from projects
    left join issues on issues.project_id = projects.id
    group by projects.id, projects.name
    order by projects.created_at desc`
  );

  if (auth && auth.organizations.length === 0) {
    return <Navigate to="/teams" />;
  }

  return (
    <>
      <ProjectsList projects={projects} />
      <Outlet />
    </>
  );
}
