import { useEffect, useState } from "react";
import {
  useMatch,
  Form,
  NavLink,
  Outlet,
  redirect,
  type ClientLoaderFunctionArgs,
  Link,
} from "react-router";
import {
  Package,
  LogOut,
  Triangle,
  Settings,
  SquareUserRound,
  Library,
  Crosshair,
  SquarePen,
} from "lucide-react";
import clsx from "clsx";
import { RequireAuth } from "~/context/auth.provider";
import { useAuth } from "~/context/auth.context";
import { TeamButton } from "~/components/shared/button";

export const clientLoader = ({ request }: ClientLoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.pathname === "/") {
    return redirect("/assigned");
  }

  return {};
};

const navigation = [
  {
    key: "assigned",
    label: "My issues",
    icon: <Crosshair size={14} />,
  },
  {
    key: "projects",
    label: "Projects",
    icon: <Package size={14} />,
  },
  {
    key: "teams",
    label: "Teams",
    icon: <SquareUserRound size={14} />,
  },
];

interface TeamMenuProps {
  organization: { id: string; name: string };
}

function TeamsMenu(props: TeamMenuProps) {
  const cachedOpen = localStorage.getItem(
    `menu-open-state-${props.organization.id}`
  );
  const match = useMatch(`/teams/${props.organization.id}/*`);
  const [open, setOpen] = useState(
    match !== null || (cachedOpen && JSON.parse(cachedOpen))
  );

  useEffect(() => {
    localStorage.setItem(`menu-open-state-${props.organization.id}`, open);
  }, [open]);

  return (
    <div className="space-y-1">
      <div
        className="px-2 py-1 rounded-sm hover:bg-zinc-900"
        onClick={() => setOpen((prev) => !prev)}
      >
        <div className="flex items-center space-x-3">
          <div>
            <TeamButton>{props.organization.name}</TeamButton>
          </div>
          <span className="flex-grow text-zinc-400">
            <Triangle
              size={8}
              fill={"rgb(212, 212, 216, 1)"}
              className={clsx("scale-y-110", open ? "rotate-180" : "rotate-90")}
            />
          </span>
        </div>
      </div>
      {open && (
        <ul className="pb-2">
          <li className="mb-0.5 h-7">
            <NavLink
              to={`/teams/${props.organization.id}/issues/all`}
              className={({ isActive }) =>
                clsx(
                  "w-full h-full px-2 space-x-2 rounded-sm pl-6 flex items-center",
                  isActive
                    ? "text-zinc-300 bg-zinc-900"
                    : "text-zinc-400 hover:text-zinc-300 hover:bg-zinc-900"
                )
              }
            >
              <div className="flex items-center justify-center">
                <Library size={14} />
              </div>
              <span className="text-sm font-medium">Issues</span>
            </NavLink>
          </li>
          {[
            {
              to: `active`,
              label: "Active",
            },
            {
              to: `backlog`,
              label: "Backlog",
            },
          ].map(({ to, label }, index) => (
            <li
              key={to}
              className={clsx(
                "h-7 pl-6 flex",
                index ? "items-end" : "items-start"
              )}
            >
              <div className="h-full w-3 flex items-center">
                <div className="w-2 h-full border-r border-zinc-800" />
              </div>
              <NavLink
                to={`/teams/${props.organization.id}/issues/${to}`}
                className={({ isActive }) =>
                  clsx(
                    "h-[27px] px-2.5 w-full flex items-center space-x-2 rounded-sm",
                    isActive
                      ? "text-zinc-300 bg-zinc-900"
                      : "text-zinc-400 hover:text-zinc-300 hover:bg-zinc-900"
                  )
                }
              >
                <span className="text-sm font-medium">{label}</span>
              </NavLink>
            </li>
          ))}
          <li className="mt-0.5 h-7">
            <NavLink
              to={`/teams/${props.organization.id}/projects`}
              className={({ isActive }) =>
                clsx(
                  "w-full px-2 space-x-2 rounded-sm mb-0.5 h-7 pl-6 flex items-center",
                  isActive
                    ? "text-zinc-300 bg-zinc-900"
                    : "text-zinc-400 hover:text-zinc-300 hover:bg-zinc-900"
                )
              }
            >
              <div className="flex items-center justify-center">
                <Package size={14} />
              </div>
              <span className="text-sm font-medium">Projects</span>
            </NavLink>
          </li>
        </ul>
      )}
    </div>
  );
}

export default function IndexPage() {
  const { auth } = useAuth();
  const matchTeams = useMatch(`/teams/:id/*`);
  const matchIssue = useMatch(`/teams/:id/issue/:issueid`);

  return (
    <RequireAuth>
      <div className="h-full flex max-w-7xl mx-auto">
        <nav
          className={clsx(
            "hidden sm:flex pt-5 pb-6 pl-4 w-48 md:w-64 flex-shrink-0 rounded-lg flex-col justify-between overflow-y-auto",
            "scroller"
          )}
        >
          <div>
            <div className="flex justify-end">
              <Link
                to={
                  matchTeams
                    ? matchIssue
                      ? `${matchTeams.pathnameBase}/issues/all/new`
                      : `${matchTeams.pathname}/new`
                    : "/assigned/new"
                }
                className="p-2 rounded-sm text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800"
              >
                <SquarePen size={16} />
              </Link>
            </div>
            <div className="space-y-10">
              <div>
                <h4 className="pb-2 uppercase text-xs font-bold text-zinc-500">
                  Workspace
                </h4>
                <ul className="flex flex-col space-y-0.5">
                  {navigation.map((link) => {
                    return (
                      <li key={link.key}>
                        <NavLink
                          className={({ isActive }) =>
                            clsx(
                              "py-1 px-2 w-full text-sm flex items-center space-x-2 rounded cursor-default",
                              isActive
                                ? "text-zinc-100 bg-zinc-800/80"
                                : "text-zinc-300 hover:bg-zinc-800/80 hover:shadow-button"
                            )
                          }
                          to={`/${link.key}`}
                          end
                        >
                          {link.icon}
                          <span>{link.label}</span>
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
              {auth && auth.organizations.length > 0 && (
                <div>
                  <h4 className="pb-2 uppercase text-xs font-bold text-zinc-500">
                    Teams
                  </h4>
                  <ul className="space-y-0.5">
                    {auth.organizations.map((organization) => (
                      <li key={organization.id}>
                        <TeamsMenu organization={organization} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <ul className="pl-1.5 mt-6 space-y-2">
            <li>
              <button className="text-zinc-400 hover:text-zinc-300 flex items-center space-x-2">
                <Settings size={16} />
                <span className="text-sm">Settings</span>
              </button>
            </li>
            <li>
              <Form
                method="post"
                action="/logout"
                onSubmit={() =>
                  localStorage.removeItem("sqlsync-selected-document")
                }
              >
                <button className="text-zinc-400 hover:text-zinc-300 flex items-center space-x-2">
                  <LogOut size={16} />
                  <span className="text-sm">Sign Out</span>
                </button>
              </Form>
            </li>
          </ul>
        </nav>
        <section className="flex-grow p-3 overflow-hidden">
          <div className="h-full border border-zinc-800 bg-zinc-900/50 rounded-lg flex flex-col">
            <Outlet />
          </div>
        </section>
      </div>
    </RequireAuth>
  );
}
