import {
  CircleAlert,
  CircleCheck,
  CircleGauge,
  CircleParking,
  CircleUserRound,
  CircleX,
  Clock9,
} from "lucide-react";
import Select from "~/components/select";
import UserIcon from "~/components/shared/user-icon";

export const priorityIcons = [
  (size = 16) => (
    <div className="text-emerald-600 -rotate-180">
      <CircleGauge size={size} />
    </div>
  ),
  (size = 16) => (
    <div className="text-amber-600 -rotate-90">
      <CircleGauge size={size} />
    </div>
  ),
  (size = 16) => (
    <div className="text-orange-600 -rotate-45">
      <CircleGauge size={size} />
    </div>
  ),
  (size = 16) => (
    <div className="text-red-600">
      <CircleGauge size={size} />
    </div>
  ),
];

export const statusIcons = {
  backlog: (size = 16) => (
    <span className="text-indigo-500">
      <CircleParking size={size} />
    </span>
  ),
  todo: (size = 16) => (
    <span className="text-yellow-500">
      <Clock9 size={size} />
    </span>
  ),
  inprogress: (size = 16) => (
    <span className="text-sky-500">
      <CircleUserRound size={size} />
    </span>
  ),
  done: (size = 16) => (
    <span className="text-emerald-500">
      <CircleCheck size={size} />
    </span>
  ),
  blocked: (size = 16) => (
    <span className="text-red-500">
      <CircleAlert size={size} />
    </span>
  ),
  canceled: (size = 16) => (
    <span className="text-amber-500">
      <CircleX size={size} />
    </span>
  ),
};

interface IssueDetailsProps {
  users?: {
    id: string;
    name: string;
  }[];
  defaultAssignee?: string;
  defaultStatus?: string;
  defaultPriority?: string;
  onChangeAssignee?: (value: string | null) => void;
  onChangeStatus?: (value: string | null) => void;
  onChangePriority?: (value: string | null) => void;
}

export default function IssueDetails(props: IssueDetailsProps) {
  return (
    <div className="flex space-x-1">
      <Select
        name="assigned_to"
        items={[
          {
            id: null,
            name: "Unassigned",
            icon: (size) => (
              <span className="text-zinc-400">
                <CircleUserRound size={size} />
              </span>
            ),
          },
          ...(props.users?.map((user) => ({
            ...user,
            icon: (size: number) => (
              <div style={{ width: `${size}px`, height: `${size}px` }}>
                <UserIcon name={user.name} />
              </div>
            ),
          })) ?? []),
        ]}
        defaultValue={props.defaultAssignee}
        onChange={props.onChangeAssignee}
      />
      <Select
        name="status"
        items={[
          {
            id: "backlog",
            name: "Backlog",
            icon: statusIcons["backlog"],
          },
          {
            id: "todo",
            name: "Todo",
            icon: statusIcons["todo"],
          },
          {
            id: "inprogress",
            name: "In Progress",
            icon: statusIcons["inprogress"],
          },
          {
            id: "done",
            name: "Done",
            icon: statusIcons["done"],
          },
          {
            id: "blocked",
            name: "Blocked",
            icon: statusIcons["blocked"],
          },
          {
            id: "canceled",
            name: "Canceled",
            icon: statusIcons["canceled"],
          },
        ]}
        defaultValue={props.defaultStatus ?? "backlog"}
        onChange={props.onChangeStatus}
      />
      <Select
        name="priority"
        items={[
          {
            id: "0",
            name: "Low",
            icon: priorityIcons[0],
          },
          {
            id: "1",
            name: "Medium",
            icon: priorityIcons[1],
          },
          {
            id: "2",
            name: "High",
            icon: priorityIcons[2],
          },
          {
            id: "3",
            name: "Urgent",
            icon: priorityIcons[3],
          },
        ]}
        defaultValue={props.defaultPriority ?? "0"}
        onChange={props.onChangePriority}
      />
    </div>
  );
}
