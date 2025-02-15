import { Outlet } from "react-router";
import { useQuery } from "~/context/document.context";
import { sql } from "@orbitinghail/sqlsync-worker";
import ProjectsList from "../../projects/components/list";
import ProjectsHeader from "../../projects/components/header";

export default function TeamProjectsPage() {
  const { rows: projects } = useQuery<{
    id: string;
    name: string;
  }>(sql`
      select
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
  `);

  return (
    <>
      <ProjectsHeader />
      <ProjectsList projects={projects} />
      <Outlet />
    </>
  );
}
