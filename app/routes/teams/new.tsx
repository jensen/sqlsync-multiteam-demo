import { useState } from "react";
import {
  Form,
  useSubmit,
  redirectDocument,
  useActionData,
  type ActionFunctionArgs,
} from "react-router";
import { TextInput } from "~/components/shared/input";
import { OutlineButton, PrimaryButton } from "~/components/shared/button";
import { StaticModal, useRouteModal } from "~/components/shared/modal";

export const clientAction = async ({ request }: ActionFunctionArgs) => {
  const body = await request.formData();

  const name = (body.get("name") ?? "") as string;

  if (name.trim() === "") {
    return {
      error: "Must provide name",
    };
  }

  const response = await fetch(`${import.meta.env.VITE_BASE_URL}/doc/new`, {
    credentials: "include",
    method: "post",
    body,
  });

  if (response.ok) {
    const body = await response.json();

    return redirectDocument(`/teams/${body.id}/issues/all`);
  }

  return {
    error: "Fetch error",
  };
};

export default function TeamsNewPage() {
  const data = useActionData() as undefined | { error: string };
  const submit = useSubmit();
  const { close, ...modalProps } = useRouteModal();

  return (
    <StaticModal {...modalProps}>
      <Form
        className="px-8 py-6 flex flex-col space-y-4 h-full justify-between"
        method="post"
        onKeyUp={(event) => {
          if (event.key === "Enter") {
            submit(event.currentTarget);
          }
        }}
      >
        <div>
          <TextInput name="name" placeholder="Team name" />
          <div className="mt-2 mb-10 h-4 text-red-500 text-sm">
            {data?.error}
          </div>
        </div>
        <div className="flex justify-end space-x-4">
          <OutlineButton type="button" onClick={close}>
            Cancel
          </OutlineButton>
          <PrimaryButton>Save</PrimaryButton>
        </div>
      </Form>
    </StaticModal>
  );
}
