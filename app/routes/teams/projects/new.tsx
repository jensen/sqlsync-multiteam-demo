import {
  Form,
  redirect,
  useSubmit,
  type ActionFunctionArgs,
} from "react-router";
import { useMemo } from "react";
import { TextInput } from "~/components/shared/input";
import {
  OutlineButton,
  PrimaryButton,
  TeamIcon,
} from "~/components/shared/button";
import { StaticModal, useRouteModal } from "~/components/shared/modal";
import { mutate } from "~/lib/sqlsync";
import TeamSelect from "~/components/select/team";
import { useAuth } from "~/context/auth.context";
import { TeamIcon } from "~/components/shared/button";

export const clientAction = async ({ request }: ActionFunctionArgs) => {
  const body = Object.fromEntries(await request.formData()) as {
    name: string;
    team: string;
  };

  const id = crypto.randomUUID();

  if (body.name?.trim() !== "") {
    try {
      await mutate(
        { tag: "AddProject", id, ...body, created_by: "" },
        body.team
      );
    } catch (error) {
      console.error("Failed to add message", error);
    }
  }

  return redirect(`..`);
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
