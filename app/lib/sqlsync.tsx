import { SQLSyncProvider } from "@orbitinghail/sqlsync-react";
import {
  type DocId,
  journalIdFromString,
  SQLSync,
} from "@orbitinghail/sqlsync-worker";
import { type Mutation, MutationDocType } from "~/doctype";
import { type PropsWithChildren } from "react";
import { useAuth } from "~/context/auth.context";
import { DocumentProvider } from "~/context/document.provider";
import { useMatch } from "react-router";

import sqlSyncWasmUrl from "@orbitinghail/sqlsync-worker/sqlsync.wasm?url";
import workerUrl from "@orbitinghail/sqlsync-worker/worker.js?worker&url";

const BASE_URL = import.meta.env.VITE_BASE_URL ?? "http://localhost:8080";
const COORDINATOR_URL = BASE_URL.replace(
  /^(https?:\/\/)/,
  ""
);
const COORDINATOR_URL_WS = `${
  BASE_URL.startsWith("https://") ? "wss" : "ws"
}://${COORDINATOR_URL}`;

export function ConnectedProvider(props: PropsWithChildren) {
  const { auth } = useAuth();

  const matchesTeam = useMatch(`/teams/:teamid/*`);

  const documents =
    auth?.organizations?.map((organization) => organization.document) ?? [];

  const document = matchesTeam
    ? auth?.organizations.find(
        (organization) => organization.id === matchesTeam.params.teamid
      )?.document ?? null
    : null;

  return (
    <SQLSyncProvider
      wasmUrl={sqlSyncWasmUrl}
      workerUrl={workerUrl}
      coordinatorUrl={COORDINATOR_URL_WS}
    >
      <DocumentProvider document={document} documents={documents}>
        {props.children}
      </DocumentProvider>
    </SQLSyncProvider>
  );
}

export async function mutate(mutation: Mutation, document?: string) {
  const sqlsync = new SQLSync(workerUrl, sqlSyncWasmUrl, COORDINATOR_URL_WS);

  const docId = document || localStorage.getItem("sqlsync-selected-document");

  if (docId === null) {
    throw new Error("Must have a document selected");
  }

  const user = JSON.parse(
    localStorage.getItem("sqlsync-current-user") ?? "null"
  );

  if ("created_by" in mutation) {
    if (mutation.created_by === "") {
      mutation.created_by = user.id;
    }
  }

  await sqlsync.mutate(
    journalIdFromString(docId) as unknown as DocId,
    MutationDocType,
    mutation
  );

  return sqlsync.close();
}
