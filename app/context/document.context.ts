import { createContext, useContext, useMemo } from "react";
import {
  journalIdToString,
  type JournalId,
  type ParameterizedQuery,
} from "@orbitinghail/sqlsync-worker";
import {
  useMutate as useDocumentMutate,
  useQuery as useDocumentQuery,
  type Mutation,
} from "~/doctype";

type QueryState<R> =
  | {
      state: "pending";
      rows?: R[];
      grouped?: { [key: string]: R[] };
    }
  | {
      state: "success";
      rows: R[];
      grouped?: { [key: string]: R[] };
    };

export const DocumentContext = createContext<{
  document: string | null;
  documents: string[];
  journalId: JournalId | null;
  journalIds: JournalId[];
}>({ document: null, documents: [], journalId: null, journalIds: [] });

export function useDocument() {
  return useContext(DocumentContext);
}

export function useCombinedQuery<T extends { id: string }>(
  journalIds: JournalId[],
  query: ParameterizedQuery | string
): QueryState<T> {
  const combined: T[] = [];
  const grouped: {
    [key: string]: T[];
  } = {};
  const ids: { [key: string]: boolean } = {};
  const status = [];

  for (const journalId of journalIds) {
    //@ts-expect-error
    const mutate = useDocumentMutate(journalId);
    //@ts-expect-error
    const { rows, state } = useDocumentQuery<T>(journalId, query);

    status.push(state);

    if (rows) {
      for (const row of rows) {
        if (ids[row.id] === undefined) {
          const document = journalIdToString(journalId);

          if (grouped[document] === undefined) {
            grouped[document] = [];
          }

          grouped[document].push(row);

          combined.push({
            ...row,
            document,
            mutate,
          });

          ids[row.id] = true;
        }
      }
    }
  }

  return {
    rows: combined,
    grouped,
    state: status.every((state) => state === "success") ? "success" : "pending",
  };
}

export function useQuery<T extends { id: string }>(
  query: ParameterizedQuery | string
): QueryState<T> {
  const { journalId, journalIds } = useDocument();

  if (journalId === null) {
    return useCombinedQuery<T>(journalIds, query);
  }

  //@ts-expect-error
  return useDocumentQuery<T>(journalId, query);
}

export function useMutate() {
  const { journalId } = useDocument();

  if (journalId === null) {
    return null;
  }

  //@ts-expect-error
  const mutate = useDocumentMutate(journalId);

  return (mutation: Mutation) => mutate(mutation);
}
