import {
  route,
  index,
  layout,
  type RouteConfig,
} from "@react-router/dev/routes";

const routes: RouteConfig = [
  layout("routes/auth/layout.tsx", [
    route("/login", "routes/auth/login.tsx"),
    route("/register", "routes/auth/register.tsx"),
  ]),
  route("/logout", "routes/auth/logout.ts"),
  route("/", "routes/index.tsx", [
    layout("routes/assigned/layout.tsx", [
      route("assigned", "routes/assigned/index.tsx", [
        route("new", "routes/assigned/new.tsx"),
      ]),
      route("assigned/:issueid", "routes/assigned/id.tsx"),
    ]),
    layout("routes/projects/layout.tsx", [
      route("projects", "routes/projects/index.tsx", [
        route("new", "routes/projects/new.tsx"),
      ]),
    ]),
    route("teams", "routes/teams/index.tsx", [
      route("new", "routes/teams/new.tsx"),
    ]),
    route("teams/:teamid", "routes/teams/id.tsx", [
      route("join", "routes/teams/join.tsx"),
      layout("routes/teams/layout.tsx", [
        route("issue/:issueid", "routes/issues/id.tsx"),
        route("issues/:filter", "routes/teams/issues.tsx", [
          route("new", "routes/issues/new.tsx"),
        ]),
      ]),
      route("projects", "routes/teams/projects/index.tsx", [
        route("new", "routes/teams/projects/new.tsx"),
      ]),
      route("projects/:projectid", "routes/teams/projects/issues.tsx", [
        route("new", "routes/projects/id.new.tsx"),
      ]),
    ]),
  ]),
];

export default routes;
