import { Outlet } from "react-router";
import ProjectsHeader from "./components/header";

export default function ProjectLayout() {
  return (
    <>
      <ProjectsHeader />
      <Outlet />
    </>
  );
}
