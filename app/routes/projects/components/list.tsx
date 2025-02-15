import { Link, useMatch, useParams } from "react-router";
import { Package } from "lucide-react";
import { useAuth } from "~/context/auth.context";
import { formatPercent } from "~/lib/number";
import { statusIcons } from "~/routes/issues/components/details";
import { clsx } from "clsx";

function getTeamId(teams, document) {
  return teams.find((team) => team.document === document)?.id;
}

export default function ProjectsList(props) {
  const { auth } = useAuth();
  const match = useMatch("/projects");

  return (
    <>
      <div className="pl-12 pr-8 py-2 border-b border-zinc-800 flex items-center justify-between">
        <div className="text-xs text-zinc-500 font-semibold">Project</div>
        <div className="flex items-center space-x-8">
          <div className="w-10 flex justify-center">
            {statusIcons.backlog(16)}
          </div>
          <div className="w-10 flex justify-center">
            {statusIcons.inprogress(16)}
          </div>
          <div className="w-10 flex justify-center">{statusIcons.done(16)}</div>
          <div className="w-10 flex justify-center">
            {statusIcons.blocked(16)}
          </div>
          <div className="w-10 flex justify-center">
            {statusIcons.canceled(16)}
          </div>
        </div>
      </div>
      {props.projects?.map((project) => (
        <Link
          key={project.id}
          className="flex item-center justify-between pl-12 pr-8 py-2 border-b border-zinc-800 hover:bg-zinc-900 cursor-default"
          to={
            match
              ? `/teams/${getTeamId(
                  auth?.organizations,
                  project.document
                )}/projects/${project.id}`
              : project.id
          }
        >
          <div className="h-8 text-zinc-200 flex items-center space-x-4">
            <Package size={14} />
            <span className="text-sm font-medium">{project.name}</span>
          </div>
          <div className="space-x-8 flex items-center">
            {[
              {
                value: project.backlog_count,
                color: "text-indigo-500",
              },
              {
                value: project.active_count,
                color: "text-sky-500",
              },
              {
                value: project.done_count,
                color: "text-emerald-500",
              },
              {
                value: project.blocked_count,
                color: "text-red-500",
              },
              {
                value: project.canceled_count,
                color: "text-amber-500",
              },
            ].map(({ value, color }) => (
              <div
                key={color}
                className={clsx(
                  "w-10 flex justify-center text-xs font-bold",
                  color
                )}
              >
                {project.total === 0
                  ? `0%`
                  : formatPercent(value / project.total)}
              </div>
            ))}
          </div>
        </Link>
      ))}
    </>
  );
}
