import { sql } from "@orbitinghail/sqlsync-worker";
import { useParams } from "react-router";
import { useQuery, useMutate } from "~/context/document.context";
import Issue from "./components/issue";

export default function IssueSinglePage() {
  const { issueid } = useParams();

  const { rows: issues } = useQuery<{
    id: string;
    title: string;
    body: string;
    assigned_to: string;
    status: string;
    priority: string;
    archived_at: string;
    project_id: string | null;
  }>(
    sql`select id, title, body, assigned_to, status, priority, archived_at, project_id from issues where id = ${issueid}`
  );

  if (issues === undefined || issues.length === 0) {
    return null;
  }

  const [issue] = issues;

  return <Issue issue={issue} />;
}
