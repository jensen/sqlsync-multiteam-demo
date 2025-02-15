import { type ClientActionFunctionArgs, Form } from "react-router";
import { PrimaryButton } from "~/components/shared/button";

export const clientAction = async ({
  request,
  params,
}: ClientActionFunctionArgs) => {
  const { id } = params;

  const response = await fetch(
    `${import.meta.env.VITE_BASE_URL}/doc/${id}/accept`,
    {
      credentials: "include",
      method: "post",
    }
  );

  if (response.ok) {
    return {};
  }

  return {
    error: "Could not accept invite",
  };
};

export default function TeamJoin() {
  return (
    <div className="h-full flex items-center justify-center">
      <Form method="post">
        <PrimaryButton>Join</PrimaryButton>
      </Form>
    </div>
  );
}
