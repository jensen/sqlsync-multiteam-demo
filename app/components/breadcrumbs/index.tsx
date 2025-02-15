import { useState } from "react";
import { TeamButton } from "../shared/button";
import { ChevronRight, CalendarPlus, CalendarClock, Trash } from "lucide-react";
import { Link, useMatches } from "react-router";
import Menu from "../menu";
import { capitalize, shortname } from "~/lib/string";
import DeleteConfirmation from "~/routes/issues/components/delete";
import { type Mutation } from "~/doctype";

interface BreadcrumbsProps {
  rootLabel?: string;
  team?: {
    id: string;
    name: string;
  };
  issue?: { id: string; title: string; document?: string };
  project?: {
    id: string;
    name: string;
  };
  mutate: (mutation: Mutation) => Promise<void>;
}

export default function Breadcrumbs(props: BreadcrumbsProps) {
  const matches = useMatches();
  const filter = matches[matches.length - 1].params.filter;
  const [deleteConfirmation, setDeleteConfirmation] = useState<string[]>([]);

  return (
    <div className="px-[45px] h-12 flex items-center justify-between">
      <div className="flex items-center">
        {props.team && props.rootLabel === undefined ? (
          <>
            <Link
              to={`/teams/${props.team.id}/issues/all`}
              className="px-1 py-1"
            >
              <TeamButton>{props.team.name}</TeamButton>
            </Link>
            <ChevronRight size={12} />
            <div className="text-sm pl-1 py-1 text-neutral-400">
              {props.issue
                ? `${shortname(props.team.name)}-${props.issue.id.substring(
                    0,
                    6
                  )}`.toUpperCase()
                : filter && filter !== "all"
                ? capitalize(filter)
                : props.project
                ? props.project.name
                : "All Issues"}
            </div>
          </>
        ) : (
          <>
            <Link to={`/assigned`} className="px-1 py-1">
              <button className="w-full py-1 group flex items-center space-x-2 text-zinc-300 hover:text-zinc-100">
                <span className="text-sm font-medium">{props.rootLabel}</span>
              </button>
            </Link>
            <ChevronRight size={12} />
            <div className="text-sm px-1 py-1 text-neutral-400">
              {props.issue
                ? props.team
                  ? `${shortname(props.team.name)}-${props.issue.id.substring(
                      0,
                      6
                    )}`.toUpperCase()
                  : `${props.issue.id.substring(0, 6)}`.toUpperCase()
                : "All Issues"}
            </div>
          </>
        )}
        {props.issue && (
          <Menu
            side="right"
            items={[
              {
                id: "due",
                label: "Set due date",
                icon: <CalendarPlus size={16} />,
                onClick: () => null,
              },
              {
                id: "remind",
                label: "Remind me",
                icon: <CalendarClock size={16} />,
                onClick: () => null,
              },
              {
                id: "delete",
                label: "Delete",
                icon: <Trash size={16} />,
                onClick: () => setDeleteConfirmation([props.issue?.id]),
              },
            ]}
          />
        )}
      </div>
      {props.issue && (
        <DeleteConfirmation
          issues={deleteConfirmation.length > 0 ? [props.issue.id] : []}
          onConfirm={() => {
            if (props.mutate) {
              props.mutate({
                tag: "ArchiveIssues",
                ids: deleteConfirmation,
              });
            }

            setDeleteConfirmation([]);
          }}
          onCancel={() => setDeleteConfirmation([])}
        />
      )}
    </div>
  );
}
