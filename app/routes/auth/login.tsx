import {
  type ActionFunctionArgs,
  Form,
  redirectDocument,
  useActionData,
  useNavigate,
} from "react-router";
import { PrimaryButton } from "~/components/shared/button";
import { TextInput } from "~/components/shared/input";
import { useAuthAnimation } from "./layout";

export const clientAction = async ({ request }: ActionFunctionArgs) => {
  const body = await request.formData();

  const response = await fetch(`${import.meta.env.VITE_BASE_URL}/auth/login`, {
    credentials: "include",
    method: "post",
    body,
  });

  if (response.ok) {
    return redirectDocument("/assigned");
  }

  return {
    error: "Incorrect email",
  };
};

export default function LoginPage() {
  const navigate = useNavigate();
  const data = useActionData() as undefined | { error: string };
  const { setAnimate } = useAuthAnimation();

  return (
    <>
      <Form className="flex flex-col space-y-8" method="post" action="/login">
        <label className="text-base font-bold text-zinc-50/20">
          Email
          <TextInput name="email" autoFocus />
        </label>
        <PrimaryButton>Login</PrimaryButton>
      </Form>
      <div className="mt-2 mb-10 h-4 text-red-500 text-sm">{data?.error}</div>
      <div className="text-sm font-light">
        <div className="text-sm font-light flex space-x-1">
          <span>Don't have an account?</span>
          <a
            href="/register"
            className="font-bold text-violet-600 hover:text-violet-500"
            onClick={(event) => {
              event.preventDefault();
              setAnimate("out");
              setTimeout(() => {
                setAnimate("in");
                navigate("/register");
              }, 300);
            }}
          >
            Register
          </a>
        </div>
      </div>
    </>
  );
}
