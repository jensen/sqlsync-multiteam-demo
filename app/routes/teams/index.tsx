import { Form, Link, Outlet } from "react-router";
import {
  Check,
  CirclePlus,
  DoorClosed,
  DoorOpen,
  Share,
  SquareUserRound,
  Trash,
  Box,
  Boxes,
} from "lucide-react";
import { useAuth } from "~/context/auth.context";
import { useDocument } from "~/context/document.context";
import { Modal, useModal } from "~/components/shared/modal";
import {
  DangerButton,
  OutlineButton,
  PrimaryButton,
} from "~/components/shared/button";
import { useQuery } from "~/context/document.context";
import { sql } from "@orbitinghail/sqlsync-worker";
import { pluralize } from "~/lib/string";

interface ShareTeamProps {
  document: string;
}

function ShareTeam(props: ShareTeamProps) {
  return (
    <button
      className="p-2 rounded text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50"
      onClick={(event) => {
        event.stopPropagation();
        navigator.clipboard.writeText(
          `${window.origin}/teams/${props.document}/join`
        );
      }}
    >
      <Share size={16} />
    </button>
  );
}

interface RemoveTeamProps {
  id: string;
}

function RemoveTeam(props: RemoveTeamProps) {
  const { auth } = useAuth();
  const { open, close, ...modalProps } = useModal();

  const team = auth?.organizations.find(
    (organization) => organization.id === props.id
  );

  return (
    <>
      <button
        className="p-2 rounded text-zinc-400 hover:bg-red-800 hover:text-zinc-50"
        onClick={(event) => {
          event.stopPropagation();
          open();
        }}
      >
        <Trash size={14} />
      </button>
      <Modal {...modalProps}>
        <div className="px-8 py-6 flex flex-col justify-between h-full">
          <p className="text-base">
            Are you sure you would like to delete team{" "}
            <span className="font-semibold text-red-400">{team?.name}</span>?
          </p>
          <Form
            className="flex justify-end space-x-4"
            onSubmit={(event) => {
              event.preventDefault();
              close();
            }}
          >
            <OutlineButton
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                close();
              }}
            >
              Cancel
            </OutlineButton>
            <DangerButton>Confirm</DangerButton>
          </Form>
        </div>
      </Modal>
    </>
  );
}

function NoTeams() {
  return (
    <div className="flex-grow flex flex-col justify-center items-center">
      <div className="max-w-48 border border-zinc-800 p-4 rounded space-y-4 flex flex-col items-center">
        <span className="text-zinc-700">
          <SquareUserRound size={48} />
        </span>
        <p className="text-sm text-zinc-300 text-center">
          It doesn't look like you belong to any teams yet.
        </p>
        <Link to="/teams/new" onClick={(event) => event.stopPropagation()}>
          <PrimaryButton>Create team</PrimaryButton>
        </Link>
      </div>
    </div>
  );
}

export default function TeamIndexPage() {
  const { auth } = useAuth();
  const { document } = useDocument();

  const { grouped: projects } = useQuery(sql`select id, name from projects`);

  const selected = auth?.organizations.find(
    (organization) => organization.document === document
  );

  return (
    <div className="h-full flex flex-col">
      <div className="px-8 py-2 flex justify-end border-b border-zinc-800">
        {auth && auth.organizations.length > 0 && (
          <Link
            className="text-zinc-300 hover:text-zinc-50 hover:bg-zinc-800 py-1 pl-3 pr-4 rounded flex justify-center items-center space-x-1"
            to="/teams/new"
            onClick={(event) => event.stopPropagation()}
          >
            <CirclePlus size={14} />
            <span className="text-sm">Create team</span>
          </Link>
        )}
      </div>
      <div className="px-2 py-2 border-b border-zinc-800 flex">
        <div className="pl-2 w-10"></div>
        <div className="text-xs text-zinc-500 font-semibold">Team</div>
      </div>
      <div className="overflow-y-auto scroller">
        {auth?.organizations.map((team) => (
          <div
            key={team.id}
            className="flex items-center pl-0.5 pr-8 py-2 border-b border-zinc-800"
          >
            <div className="h-8 w-full flex items-center py-2">
              <div className="text-green-500 w-12 flex justify-center">
                {selected?.id === team.id && <Check size={14} />}
              </div>
              <div className="text-zinc-200 w-full flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <SquareUserRound size={16} />
                  <span className="text-sm font-medium">{team.name}</span>
                </div>
              </div>
            </div>
            <div className="flex item-center space-x-2">
              {projects && projects.length > 0 && (
                <div className="w-24 flex-shrink-0 flex items-center space-x-2 text-zinc-400">
                  {projects[team.document]?.length > 1 ? (
                    <Boxes size={14} />
                  ) : (
                    <Box size={14} />
                  )}
                  <span className="text-xs font-medium">
                    {projects[team.document]?.length}{" "}
                    {pluralize(projects[team.document]?.length, "project")}
                  </span>
                </div>
              )}
              <ShareTeam document={team.document} />
              <RemoveTeam id={team.id} />
            </div>
          </div>
        ))}
      </div>
      {auth?.organizations.length === 0 && <NoTeams />}
      <Outlet />
    </div>
  );
}
