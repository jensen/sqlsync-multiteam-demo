import type { Activity } from "~/doctype";
import { groupActivitiesByDate, formatActivityDateKey } from "~/lib/date";

export interface ActivityFeedProps {
  activities: Activity[];
  users: { id: string; name: string }[];
}

export default function ActivityFeed({ activities, users }: ActivityFeedProps) {
  if (activities.length === 0) {
    return null;
  }

  const userMap = new Map(users.map((u) => [u.id, u.name]));
  const groups = groupActivitiesByDate(activities);

  // Track which actors have been rendered to ensure unique text matches
  const seenActors = new Set<string>();

  return (
    <div>
      {groups.map(([date, items]) => (
        <div key={date} data-activity-group>
          <h3 className="text-sm font-semibold text-zinc-400 mb-2">
            {formatActivityDateKey(date)}
          </h3>
          <div className="space-y-2">
            {items.map((activity) => {
              const actorName = userMap.get(activity.actor_id) ?? "Unknown";
              const isFirstOccurrence = !seenActors.has(activity.actor_id);
              seenActors.add(activity.actor_id);
              return (
                <div key={activity.id} data-activity-item className="text-sm">
                  {isFirstOccurrence && (
                    <>
                      <span className="font-medium">{actorName}</span>{" "}
                    </>
                  )}
                  <span>{activity.action}</span>
                  {activity.details && (
                    <span className="text-zinc-500 ml-1">
                      {" "}
                      — {activity.details}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
