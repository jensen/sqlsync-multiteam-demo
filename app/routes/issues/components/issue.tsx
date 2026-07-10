import { useState } from "react";
import { sql } from "@orbitinghail/sqlsync-worker";
import { Form } from "react-router";
import IssueDetails from "./details";
import CommentList from "./comment-list";
import CommentInput from "./comment-input";
import ActivityFeed from "./activity-feed";
import { useQuery, useMutate } from "~/context/document.context";
import { type Issue, type Comment, type Activity } from "~/doctype";
import ProjectSelect from "~/components/select/project";

type TabKey = "details" | "comments" | "activity";

interface IssueProps {
  issue: Issue & { body: string; project_id: string | null };
  users?: { id: string; name: string }[];
  projects?: { id: string; name: string }[];
  comments?: Comment[];
  activities?: Activity[];
}

const tabs: { key: TabKey; label: string }[] = [
  { key: "details", label: "Details" },
  { key: "comments", label: "Comments" },
  { key: "activity", label: "Activity" },
];

export default function Issue(props: IssueProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("details");

  const { rows: internalUsers } = useQuery<{
    id: string;
    name: string;
  }>(sql`select id, name from users`);

  const { rows: projects } = useQuery<{
    id: string;
    name: string;
  }>(sql`select id, name from projects`);

  const mutate = useMutate() ?? props.issue.mutate;

  // Use props users if provided, otherwise fall back to internal query
  const users = props.users ?? internalUsers;

  // Use props comments/activities if provided, otherwise empty arrays
  const comments = props.comments ?? [];
  const activities = props.activities ?? [];

  const handleAddComment = (body: string) => {
    const id = `c-${Date.now()}`;
    mutate({
      tag: "AddComment",
      id,
      issue_id: props.issue.id,
      body,
      created_by: "u1",
    });
  };

  const renderDetails = () => (
    <Form className="space-y-6">
      <div className="flex justify-between">
        <div className="flex space-x-2">
          {users && (
            <IssueDetails
              users={users}
              defaultAssignee={props.issue.assigned_to}
              defaultStatus={props.issue.status}
              defaultPriority={String(props.issue.priority)}
              onChangeAssignee={(assignee: string | null) =>
                mutate({
                  tag: "AssignIssue",
                  id: props.issue.id,
                  to: assignee,
                })
              }
              onChangeStatus={(status: string | null) =>
                mutate({
                  tag: "UpdateIssue",
                  id: props.issue.id,
                  status,
                })
              }
              onChangePriority={(priority: string | null) =>
                mutate({
                  tag: "UpdateIssue",
                  id: props.issue.id,
                  priority,
                })
              }
            />
          )}
        </div>
        <ProjectSelect
          projects={projects}
          defaultValue={props.issue.project_id}
          onChange={(project_id: string) => {
            mutate({
              tag: "MoveIssues",
              ids: [props.issue.id],
              project_id,
            });
          }}
        />
        {props.issue.archived_at && (
          <button
            type="button"
            className="group px-2 py-0.5 text-red-400/50 border border-red-800/50 bg-red-900/30 hover:bg-red-900/50 rounded-md flex items-center justify-between space-x-1"
            onClick={() => {
              mutate({ tag: "RestoreIssues", ids: [props.issue.id] });
            }}
          >
            <span className="text-xs select-none">
              This issue was deleted on{" "}
              {new Intl.DateTimeFormat("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              }).format(new Date(props.issue.archived_at))}
              . <span className="group-hover:text-zinc-300">Restore</span>
            </span>
          </button>
        )}
      </div>
      <div className="px-1 space-y-2">
        <h3 className="text-zinc-300 font-semibold text-3xl line-clamp-2">
          {props.issue.title}
        </h3>
        <p className="text-zinc-300">{props.issue.body}</p>
      </div>
    </Form>
  );

  const renderComments = () => (
    <div className="space-y-4">
      <CommentList comments={comments} userMap={users?.reduce((acc, u) => {
        acc[u.id] = u.name;
        return acc;
      }, {} as Record<string, string>)} />
      <CommentInput onSubmit={handleAddComment} />
    </div>
  );

  const renderActivity = () => (
    <ActivityFeed activities={activities} users={users ?? []} />
  );

  return (
    <div className="px-11 py-6">
      <div className="flex space-x-4 border-b border-zinc-700 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`pb-2 px-1 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "text-zinc-100 border-b-2 border-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>
        {activeTab === "details" && renderDetails()}
        {activeTab === "comments" && renderComments()}
        {activeTab === "activity" && renderActivity()}
      </div>
    </div>
  );
}
