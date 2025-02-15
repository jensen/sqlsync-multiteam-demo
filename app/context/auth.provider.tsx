import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from "react";
import { Navigate } from "react-router";
import { AuthContext, useAuth, type User } from "./auth.context";

export function AuthProvider(props: PropsWithChildren) {
  const [auth, setAuth] = useState<User | null | undefined>(undefined);

  const refresh = useCallback(
    () =>
      fetch(`${import.meta.env.VITE_BASE_URL}/auth/refresh`, {
        credentials: "include",
      })
        .then((response) => {
          if (response.ok === false) {
            throw new Error("Authentication Error");
          }

          return response.json();
        })
        .then((data: User) => {
          data.organizations.sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
          );
          setAuth(data);

          const { organizations, ...user } = data;
          localStorage.setItem("sqlsync-current-user", JSON.stringify(user));
        })
        .catch(() => {
          setAuth(null);
          localStorage.removeItem("sqlsync-current-user");
        }),
    []
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (auth === undefined) return;

  return (
    <AuthContext.Provider value={{ auth, setAuth, refresh }}>
      {props.children}
    </AuthContext.Provider>
  );
}

export function RequireAuth(props: PropsWithChildren) {
  const { auth } = useAuth();

  if (auth === null) {
    return <Navigate to="/login" />;
  }

  return props.children;
}
