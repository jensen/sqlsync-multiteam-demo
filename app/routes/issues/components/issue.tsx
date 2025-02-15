import { sql } from "@orbitinghail/sqlsync-worker";
import { Form } from "react-router";
import IssueDetails from "./details";
import { useQuery, useMutate } from "~/context/document.context";
import { type Issue } from "~/doctype";
import ProjectSelect from "~/components/select/project";

interface IssueProps {
  users: { id: string }[];
  projects: { id: string; name: string }[];
  issue: Issue;
}

export default function Issue(props: IssueProps) {
  const { rows: users } = useQuery<{
    id: string;
    name: string;
  }>(sql`select id, name from users`);

  const { rows: projects } = useQuery<{
    id: string;
    name: string;
  }>(sql`select id, name from projects`);

  const mutate = useMutate() ?? props.issue.mutate;

  return (
    <Form className="px-11 py-6 space-y-6">
      <div className="flex justify-between">
        <div className="flex space-x-2">
          {users && (
            <IssueDetails
              users={users}
              defaultAssignee={props.issue.assigned_to}
              defaultStatus={props.issue.status}
              defaultPriority={String(props.issue.priority)}
              onChangeAssignee={(assignee: string | null) =>
                mutate({
                  tag: "AssignIssue",
                  id: props.issue.id,
                  to: assignee,
                })
              }
              onChangeStatus={(status: string | null) =>
                mutate({
                  tag: "UpdateIssue",
                  id: props.issue.id,
                  status,
                })
              }
              onChangePriority={(priority: string | null) =>
                mutate({
                  tag: "UpdateIssue",
                  id: props.issue.id,
                  priority,
                })
              }
            />
          )}
        </div>
        <ProjectSelect
          projects={projects}
          defaultValue={props.issue.project_id}
          onChange={(project_id: string) => {
            mutate({
              tag: "MoveIssues",
              ids: [props.issue.id],
              project_id,
            });
          }}
        />
        {props.issue.archived_at && (
          <button
            type="button"
            className="group px-2 py-0.5 text-red-400/50 border border-red-800/50 bg-red-900/30 hover:bg-red-900/50 rounded-md flex items-center justify-between space-x-1"
            onClick={() => {
              mutate({ tag: "RestoreIssues", ids: [props.issue.id] });
            }}
          >
            <span className="text-xs select-none">
              This issue was deleted on{" "}
              {new Intl.DateTimeFormat("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              }).format(new Date(props.issue.archived_at))}
              . <span className="group-hover:text-zinc-300">Restore</span>
            </span>
          </button>
        )}
      </div>
      <div className="px-1 space-y-2">
        <h3 className="text-zinc-300 font-semibold text-3xl line-clamp-2">
          {props.issue.title}
        </h3>
        <p className="text-zinc-300">{props.issue.body}</p>
      </div>
    </Form>
  );
}
