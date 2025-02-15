import { sql } from "@orbitinghail/sqlsync-worker";
import { useParams } from "react-router";
import { useQuery } from "~/context/document.context";
import { type Mutation } from "~/doctype";
import Issue from "../issues/components/issue";

export default function IssueSinglePage() {
  const { issueid } = useParams();

  const { rows: issues, state } = useQuery<
    {
      id: string;
      title: string;
      body: string;
      assigned_to: string;
      status: string;
      priority: string;
      archived_at: string;
      project_name: string | null;
      project_id: string | null;
      document: string;
    } & { mutate: (m: Mutation) => void }
  >(
    sql`
        select
          issues.id, title, body, assigned_to, status, priority, archived_at, project_id, projects.name as project_name
        from issues
        left join projects on projects.id = issues.project_id
        where issues.id = ${issueid}`
  );

  if (state === "pending" || issues.length === 0) return;

  const [issue] = issues;

  return (
    <>
      <Issue issue={issue} />
    </>
  );
}
