import { redirectDocument } from "react-router";

export const clientAction = async () => {
  const response = await fetch(`${import.meta.env.VITE_BASE_URL}/auth/logout`, {
    credentials: "include",
    method: "post",
  });

  if (response.ok) {
    return redirectDocument("/login");
  }
};
