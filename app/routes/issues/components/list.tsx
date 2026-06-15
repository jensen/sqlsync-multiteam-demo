import { useState, useRef, type SetStateAction, type Dispatch } from "react";
import { Link, useParams } from "react-router";
import {
  Boxes,
  CalendarPlus,
  CircleUserRound,
  ListTodo,
  Check,
  CalendarClock,
  Trash,
  ListX,
  Box,
  X,
  Search,
} from "lucide-react";
import { PrimaryButton } from "~/components/shared/button";
import { pluralize } from "~/lib/string";
import Menu from "~/components/menu";
import { clsx } from "clsx";
import { priorityIcons, statusIcons } from "./details";
import { useMutate } from "~/context/document.context";
import ProjectsMenu from "~/components/menu/projects";
import UserIcon from "~/components/shared/user-icon";
import DeleteConfirmation from "./delete";

interface NoIssuesProps {
  id: string;
}

function NoIssues(props: NoIssuesProps) {
  return (
    <div className="max-w-64 border border-zinc-800 p-4 rounded space-y-4 flex flex-col items-center">
      <span className="text-zinc-700">
        <ListTodo size={48} />
      </span>
      <p className="text-sm text-zinc-300 text-center">
        It doesn't look like you have any active issues created.
      </p>
      <Link to={`new`} onClick={(event) => event.stopPropagation()}>
        <PrimaryButton>Create issue</PrimaryButton>
      </Link>
    </div>
  );
}

interface IssueListProps {
  issues: Issue[];
  search: string;
  onSearchChange: (value: string) => void;
}

export default function IssueList(props: IssueListProps) {
  const { teamid } = useParams();

  const selectMenuRef = useRef<Dispatch<SetStateAction<boolean>>>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [checked, setChecked] = useState<{ [key: string]: Issue }>({});
  const [deleteConfirmation, setDeleteConfirmation] = useState<string[]>([]);
  const [showRecentlyDeleted, setShowRecentlyDeleted] = useState(false);

  const mutate = useMutate();

  const archivedIssues =
    props.issues?.filter(({ archived_at }) => archived_at !== undefined) ?? [];
  const activeIssues =
    props.issues?.filter(({ archived_at }) => archived_at === undefined) ?? [];

  const handleDelete = (id: string) => {
    return () => {
      setDeleteConfirmation([id]);
    };
  };

  const handleDeleteChecked = () => {
    setDeleteConfirmation(
      Object.entries(checked)
        .filter(([key, value]) => value)
        .map(([key]) => key)
    );
  };

  const handleDeselectAll = () => setChecked({});

  if (props.issues === undefined) return;

  const moveMenuItem =
    props.projects && props.projects.length > 0 && mutate
      ? [
          {
            id: "moveto",
            label: "Move to",
            icon: <Boxes size={16} />,
            sub: (ref) => (
              <ProjectsMenu
                referenceElement={ref}
                projects={props.projects}
                onSelect={(id) => {
                  if (mutate) {
                    mutate({
                      tag: "MoveIssues",
                      ids: Object.keys(checked),
                      project_id: id,
                    });
                  }
                }}
              />
            ),
          },
        ]
      : [];

  const displayedIssues = showRecentlyDeleted ? archivedIssues : activeIssues;

  return (
    <div className="h-full flex flex-col">
      {/* Search bar */}
      <div className="flex-shrink-0 border-b border-zinc-800 px-4 py-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-md focus-within:border-zinc-500 transition-colors">
          <Search size={14} className="text-zinc-500 flex-shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={props.search}
            onChange={(e) => props.onSearchChange(e.target.value)}
            placeholder="Search by title or description…"
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-600 outline-none"
          />
          {props.search.length > 0 && (
            <button
              onClick={() => {
                props.onSearchChange("");
                searchInputRef.current?.focus();
              }}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 h-10 border-b border-zinc-800 flex items-center justify-between">
        <div className="pl-8 relative h-full">
          <div
            className={clsx(
              "absolute top-0 left-9",
              Object.values(checked).filter((v) => v).length === 0
                ? "opacity-0 pointer-events-none"
                : "opacity-100 transition-opacity duration-150"
            )}
          >
            <Menu
              ref={selectMenuRef}
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
                ...moveMenuItem,
                {
                  id: "deselect",
                  label: "Deselect all",
                  icon: <ListX size={16} />,
                  onClick: handleDeselectAll,
                },
                {
                  id: "delete",
                  label: "Delete",
                  icon: <Trash size={16} />,
                  onClick: handleDeleteChecked,
                },
              ]}
            />
          </div>
          {displayedIssues.length > 0 && (
            <label
              className={clsx(
                "z-20 group px-4 h-full flex items-center",
                Object.values(checked).filter((v) => v).length > 0
                  ? "opacity-0 pointer-events-none"
                  : "opacity-100 transition-opacity duration-150"
              )}
            >
              <div className="size-4 flex items-center justify-center border border-zinc-700 rounded group-hover:border-zinc-500 group-hover:text-zinc-500"></div>
              <input
                type="checkbox"
                className="hidden"
                onChange={(event) => {
                  event.stopPropagation();
                  setChecked(
                    displayedIssues.reduce((issues, issue) => {
                      issues[issue.id] = true;
                      return issues;
                    }, {} as { [key: string]: boolean }) ?? {}
                  );

                  if (selectMenuRef.current) {
                    selectMenuRef.current(true);
                  }
                }}
              />
            </label>
          )}
        </div>
        <div className="pr-4">
          {archivedIssues.length > 0 && (
            <button
              onClick={() => {
                setShowRecentlyDeleted((prev) => !prev);
                setChecked({});
              }}
              className="px-2 py-0.5 text-red-400/50 hover:text-zinc-300 border border-red-800/50 bg-red-900/30 hover:bg-red-900/50 rounded-md flex items-center justify-between space-x-1"
            >
              <span className="text-xs select-none">
                {showRecentlyDeleted
                  ? `Hide recently deleted ${pluralize(
                      archivedIssues.length,
                      "issue"
                    )}`
                  : `Show ${archivedIssues.length} recently deleted ${pluralize(
                      archivedIssues.length,
                      "issue"
                    )}`}
              </span>
              {showRecentlyDeleted && <X size={12} />}
            </button>
          )}
        </div>
      </div>
      {displayedIssues.length === 0 && (
        <div className="flex-grow flex flex-col justify-center items-center">
          {props.search.length > 0 ? (
            <div className="max-w-64 border border-zinc-800 p-4 rounded space-y-2 flex flex-col items-center">
              <span className="text-zinc-700">
                <Search size={48} />
              </span>
              <p className="text-sm text-zinc-300 text-center">
                No issues match &ldquo;{props.search}&rdquo;
              </p>
              <button
                onClick={() => props.onSearchChange("")}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Clear search
              </button>
            </div>
          ) : (
            <NoIssues id={teamid} />
          )}
        </div>
      )}
      <div className="scroller flex-grow flex flex-col overflow-y-auto pb-4">
        {displayedIssues.map((issue) => {
          const availableProjects =
            props.projects?.filter(
              (project) =>
                project.document === issue.document &&
                project.name !== issue.project_name
            ) ?? [];
          const moveMenuItem =
            availableProjects.length > 0
              ? [
                  {
                    id: "moveto",
                    label: "Move to",
                    icon: <Boxes size={16} />,
                    sub: (ref) => (
                      <ProjectsMenu
                        referenceElement={ref}
                        projects={availableProjects}
                        onSelect={(id) => {
                          if (mutate) {
                            mutate({
                              tag: "MoveIssues",
                              ids: [issue.id],
                              project_id: id,
                            });
                          } else {
                            issue.mutate({
                              tag: "MoveIssues",
                              ids: [issue.id],
                              project_id: id,
                            });
                          }
                        }}
                      />
                    ),
                  },
                ]
              : [];

          return (
            <Link
              key={issue.id}
              className="pl-8 pr-2 border-b border-zinc-800 hover:bg-zinc-950/50 cursor-default flex items-center"
              to={
                teamid
                  ? `/teams/${teamid}/issue/${issue.id}`
                  : `/assigned/${issue.id}`
              }
              onMouseDown={(event) => event.preventDefault()}
            >
              <label
                onClick={(event) => {
                  event.stopPropagation();
                }}
                className="px-4 flex-shrink-0 group h-full flex items-center"
              >
                <div className="size-4 flex items-center justify-center border border-zinc-700 rounded group-hover:border-zinc-500 group-hover:text-zinc-500">
                  {checked[issue.id] ? <Check size={12} /> : null}
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={checked[issue.id] ?? false}
                  onChange={(event) => {
                    setChecked((prev) => ({
                      ...prev,
                      [issue.id]: event.target.checked,
                    }));
                  }}
                />
              </label>
              <div className="flex-shrink-0 mr-4">
                {priorityIcons[issue.priority]()}
              </div>
              <div className="flex-grow text-sm font-medium min-w-0 truncate mr-4">
                {issue.title}
              </div>
              <div className="flex-shrink-0 flex justify-end items-center space-x-4">
                {issue.project_name && (
                  <div className="hidden md:flex rounded-sm border border-zinc-700 items-center py-0.5 px-2 space-x-1">
                    <Box size={12} />
                    <span className="text-xs text-zinc-400 truncate max-w-20">
                      {issue.project_name}
                    </span>
                  </div>
                )}
                {statusIcons[issue.status]()}
                {issue.assignee ? (
                  <UserIcon name={issue.assignee} />
                ) : (
                  <span className="text-zinc-500">
                    <CircleUserRound size={16} />
                  </span>
                )}
                <Menu
                  items={[
                    {
                      id: "duedate",
                      label: "Set due date",
                      icon: <CalendarPlus size={16} />,
                      onClick: () => null,
                    },
                    {
                      id: "remindme",
                      label: "Remind me",
                      icon: <CalendarClock size={16} />,
                      onClick: () => null,
                    },
                    ...moveMenuItem,
                    {
                      id: "delete",
                      label: "Delete",
                      icon: <Trash size={16} />,
                      onClick: handleDelete(issue.id),
                    },
                  ].filter((item) => item.sub === undefined || props.projects)}
                />
              </div>
            </Link>
          );
        })}
      </div>
      <DeleteConfirmation
        issues={
          props.issues?.filter((issue) =>
            deleteConfirmation.includes(issue.id)
          ) ?? []
        }
        onConfirm={() => {
          if (mutate) {
            mutate({ tag: "ArchiveIssues", ids: deleteConfirmation });
          } else {
            const documents: { [key: string]: Issue[] } = props.issues
              .filter(({ id }) => deleteConfirmation.includes(id))
              .reduce((issues, issue) => {
                if (issues[issue.document] === undefined) {
                  issues[issue.document] = [];
                }

                issues[issue.document].push(issue);

                return issues;
              }, {});

            for (const document of Object.values(documents)) {
              document[0].mutate({
                tag: "ArchiveIssues",
                ids: document.map(({ id }) => id),
              });
            }
          }

          setDeleteConfirmation([]);
          setChecked({});
        }}
        onCancel={() => setDeleteConfirmation([])}
      />
    </div>
  );
}