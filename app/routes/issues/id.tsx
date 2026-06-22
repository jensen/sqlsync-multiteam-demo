import { sql } from "@orbitinghail/sqlsync-worker";
import { useParams } from "react-router";
import { useQuery, useMutate } from "~/context/document.context";
import Issue from "./components/issue";
import type { Comment, Activity } from "~/doctype";

export default function IssueSinglePage() {
  const { issueid } = useParams();

  const { rows: issues } = useQuery<{
    id: string;
    title: string;
    body: string;
    assigned_to: string;
    status: "backlog" | "todo" | "inprogress" | "done" | "blocked" | "canceled";
    priority: number;
    archived_at: string;
    project_id: string | null;
  }>(
    sql`select id, title, body, assigned_to, status, priority, archived_at, project_id from issues where id = ${issueid}`
  );

  const { rows: comments } = useQuery<Comment>(
    sql`select id, issue_id, body, created_by, created_at from comments where issue_id = ${issueid} order by created_at asc`
  );

  const { rows: activities } = useQuery<Activity>(
    sql`select id, issue_id, actor_id, action, details, created_at from activities where issue_id = ${issueid} order by created_at desc`
  );

  if (issues === undefined || issues.length === 0) {
    return null;
  }

  const [issue] = issues;
  const mutate = useMutate();

  return (
    <Issue
      issue={issue}
      comments={comments ?? []}
      activities={activities ?? []}
      mutate={mutate ?? undefined}
    />
  );
}
