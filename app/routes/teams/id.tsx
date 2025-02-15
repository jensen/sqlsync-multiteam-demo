import { useEffect } from "react";
import { Outlet, useParams } from "react-router";
import { DocumentProvider, RequireDocument } from "~/context/document.provider";
import { useAuth } from "~/context/auth.context";

export default function TeamSinglePage() {
  return (
    <RequireDocument>
      <Outlet />
    </RequireDocument>
  );
}
