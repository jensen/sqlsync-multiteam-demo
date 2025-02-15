import { useMemo } from "react";
import {
  Form,
  useSubmit,
  redirect,
  type ActionFunctionArgs,
} from "react-router";
import { TextInput } from "~/components/shared/input";
import { OutlineButton, PrimaryButton } from "~/components/shared/button";
import { StaticModal, useRouteModal } from "~/components/shared/modal";
import { mutate } from "~/lib/sqlsync";
import TeamSelect from "~/components/select/team";
import { useAuth } from "~/context/auth.context";
import { TeamIcon } from "~/components/shared/button";

export const clientAction = async ({ request }: ActionFunctionArgs) => {
  const { name, team } = Object.fromEntries(await request.formData()) as {
    name?: string;
    team?: string;
  };

  if (name === undefined || team === undefined) {
    return {
      error: "Must provide name and team",
    };
  }

  const id = crypto.randomUUID();

  if (name.trim() !== "") {
    try {
      await mutate({ tag: "AddProject", id, name, created_by: "" }, team);

      return redirect("/projects");
    } catch (error) {
      return {
        error: "Failed to add project",
      };
    }
  }

  return {
    error: "Must provide name",
  };
};

export default function ProjectsNewPage() {
  const { auth } = useAuth();
  const submit = useSubmit();
  const { close, ...modalProps } = useRouteModal();

  const organizations = auth?.organizations ?? [];

  const teams = useMemo(
    () =>
      organizations.map((organization) => ({
        ...organization,
        icon: (size: number) => <TeamIcon name={organization.name} />,
      })),
    [organizations]
  );

  return (
    <StaticModal {...modalProps}>
      <Form
        className="px-8 py-6 flex flex-col h-full justify-between"
        method="post"
        onKeyUp={(event) => {
          if (event.key === "Enter") {
            submit(event.currentTarget);
          }
        }}
      >
        <TextInput name="name" placeholder="Project name" autoFocus />
        <div className="flex justify-between">
          <TeamSelect items={teams} />
          <div className="flex justify-end space-x-4">
            <OutlineButton type="button" onClick={close}>
              Cancel
            </OutlineButton>
            <PrimaryButton>Save</PrimaryButton>
          </div>
        </div>
      </Form>
    </StaticModal>
  );
}
