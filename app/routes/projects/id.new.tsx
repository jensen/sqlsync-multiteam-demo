import { useState } from "react";
import { redirect, type ActionFunctionArgs } from "react-router";
import { sql } from "@orbitinghail/sqlsync-worker";
import { Drawer } from "~/components/shared/drawer";
import { useQuery } from "~/context/document.context";
import { mutate } from "~/lib/sqlsync";
import { parseFormData } from "~/lib/form";
import CreateIssue from "../issues/components/create";

export const clientAction = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const body = parseFormData<{
    title: string;
    body: string;
    status: string;
    priority: string;
    team: string;
  }>(formData, ["title", "body", "status", "priority", "team"]);

  const project_id = formData.get("project_id");
  const assigned_to = formData.get("assigned_to");

  const id = crypto.randomUUID();

  await mutate(
    {
      tag: "AddIssue",
      id,
      ...body,
      project_id: typeof project_id === "string" ? project_id : null,
      priority: Number(body.priority),
      created_by: "",
      assigned_to: typeof assigned_to === "string" ? assigned_to : null,
    },
    body.team
  );

  return redirect("..");
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
