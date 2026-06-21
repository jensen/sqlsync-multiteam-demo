import { createDocHooks } from "@orbitinghail/sqlsync-react";
import {
  type DocType,
  serializeMutationAsJSON,
} from "@orbitinghail/sqlsync-worker";

const REDUCER_URL = new URL(
  "../reducer/target/wasm32-unknown-unknown/release/reducer.wasm",
  import.meta.url
);

export type Mutation =
  | {
      tag: "InitSchema";
    }
  | {
      tag: "AddUser";
      id: string;
      email: string;
      name: string;
    }
  | {
      tag: "AddProject";
      id: string;
      name: string;
      created_by: string;
    }
  | {
      tag: "RemoveProject";
      id: string;
    }
  | {
      tag: "AddIssue";
      id: string;
      title: string;
      body: string;
      project_id: string | null;
      created_by: string;
      assigned_to: string | null;
      status: string;
      priority: number;
    }
  | {
      tag: "AssignIssue";
      id: string;
      to: string | null;
    }
  | {
      tag: "UpdateIssue";
      id: string;
      status?: string | null;
      priority?: string | null;
    }
  | { tag: "ArchiveIssues"; ids: string[] }
  | { tag: "RestoreIssues"; ids: string[] }
  | { tag: "MoveIssues"; ids: string[]; project_id: string }
  | {
      tag: "AddComment";
      id: string;
      issue_id: string;
      body: string;
      created_by: string;
    }
  | {
      tag: "UpdateComment";
      id: string;
      body: string;
    }
  | {
      tag: "DeleteComment";
      id: string;
    }
  | {
      tag: "AddActivity";
      id: string;
      issue_id: string;
      actor_id: string;
      action: string;
      details: string | null;
    };

export type User = {
  id: string;
  email: string;
  name: string;
};

export type Issue = {
  id: string;
  title: string;
  assigned_to: string;
  priority: number;
  status: "backlog" | "todo" | "inprogress" | "done" | "blocked" | "canceled";
  archived_at: string | null;
};

export type Comment = {
  id: string;
  issue_id: string;
  body: string;
  created_by: string;
  created_at: string;
};

export type Activity = {
  id: string;
  issue_id: string;
  actor_id: string;
  action: string;
  details: string | null;
  created_at: string;
};

export const MutationDocType: DocType<Mutation> = {
  reducerUrl: REDUCER_URL,
  serializeMutation: serializeMutationAsJSON,
};

export const { useMutate, useQuery, useSetConnectionEnabled } =
  createDocHooks(MutationDocType);
