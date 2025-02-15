import {
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Navigate } from "react-router";
import { journalIdFromString } from "@orbitinghail/sqlsync-worker";
import { useMutate } from "~/doctype";
import { DocumentContext } from "./document.context";

interface DocumentProviderProps {
  document: string | null;
  documents: string[];
}

export function DocumentProvider(
  props: PropsWithChildren<DocumentProviderProps>
) {
  const { document, documents } = props;

  const [loaded, setLoaded] = useState(false);

  const journalId = useMemo(
    () => (document ? journalIdFromString(document) : null),
    [document]
  );

  const journalIds = useMemo(
    () => documents.map(journalIdFromString),
    [documents]
  );

  //@ts-expect-error
  const mutate = journalIds.map((journalId) => useMutate(journalId));

  useEffect(() => {
    Promise.all(
      mutate.map((mutate) => {
        mutate({ tag: "InitSchema" });
      })
    )
      .then(() => setLoaded(true))
      .catch((err) => {
        console.error("Failed to init schema", err);
      });
  }, [journalIds]);

  useEffect(() => {
    if (document) {
      localStorage.setItem("sqlsync-selected-document", document);
    } else {
      localStorage.removeItem("sqlsync-selected-document");
    }
  }, [document]);

  return (
    <DocumentContext.Provider
      value={{ document, documents, journalId, journalIds }}
    >
      {loaded ? props.children : null}
    </DocumentContext.Provider>
  );
}

export function RequireDocument(props: PropsWithChildren) {
  const { document } = useContext(DocumentContext);

  if (document === null) {
    return <Navigate to="/teams" />;
  }

  return props.children;
}
