import { useState } from "react";
import { redirect, type ActionFunctionArgs } from "react-router";
import { sql } from "@orbitinghail/sqlsync-worker";
import { Drawer } from "~/components/shared/drawer";
import { useQuery } from "~/context/document.context";
import { mutate } from "~/lib/sqlsync";
import CreateIssue from "./components/create";

export const clientAction = async ({ request, params }: ActionFunctionArgs) => {
  const body = Object.fromEntries(await request.formData()) as unknown as {
    title: string;
    body: string;
    project_id?: string;
    assigned_to: string | null;
    status: string;
    priority: string;
    team: string;
  };

  const id = crypto.randomUUID();

  await mutate(
    {
      tag: "AddIssue",
      id,
      ...body,
      project_id: body.project_id ?? null,
      priority: Number(body.priority),
      created_by: "",
      assigned_to: body.assigned_to ?? null,
    },
    body.team
  );

  return setTimeout(() => redirect(".."), 200);
};

export default function IssuesNewPage() {
  const [open, setOpen] = useState(true);

  const { rows: users } = useQuery<{ id: string; name: string }>(
    sql`select id, name from users`
  );

  const { rows: projects } = useQuery<{ id: string; name: string }>(
    sql`select id, name from projects`
  );

  if (users === undefined || projects === undefined) {
    return null;
  }

  return (
    <Drawer open={open}>
      <CreateIssue
        users={users}
        projects={projects}
        onClose={() => setOpen(false)}
      />
    </Drawer>
  );
}
