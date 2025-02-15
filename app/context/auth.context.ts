import {
  createContext,
  type Dispatch,
  type SetStateAction,
  useContext,
} from "react";

export type User = {
  id: string;
  organizations: {
    id: string;
    name: string;
    document: string;
    created_at: string;
  }[];
};

export const AuthContext = createContext<{
  auth: User | null | undefined;
  setAuth: Dispatch<SetStateAction<User | null | undefined>>;
  refresh: () => void;
}>({ auth: undefined, setAuth: () => null, refresh: () => null });

export function useAuth() {
  return useContext(AuthContext);
}
