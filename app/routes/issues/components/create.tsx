import { useState, useMemo } from "react";
import { Form, useParams, useSubmit } from "react-router";
import { TextInput } from "~/components/shared/input";
import { OutlineButton, PrimaryButton } from "~/components/shared/button";
import IssueDetails from "../../issues/components/details";
import TeamSelect from "~/components/select/team";
import ProjectSelect from "~/components/select/project";
import { useAuth } from "~/context/auth.context";
import { TeamIcon } from "~/components/shared/button";

type User = {
  id: string;
  name: string;
};

type Project = {
  id: string;
  name: string;
};

type Team = {
  id: string;
  name: string;
  document: string;
  created_at: string;
  icon: (size: number) => JSX.Element;
};

interface CreateIssueProps {
  users: { [key: string]: User[] } | User[];
  projects: { [key: string]: Project[] } | Project[];
}

export default function CreateIssue(props: CreateIssueProps) {
  const { id, projectid } = useParams();
  const { auth } = useAuth();
  const submit = useSubmit();
  const organizations = auth?.organizations ?? [];

  const teams = useMemo(
    () =>
      organizations.map((organization) => ({
        ...organization,
        icon: (size: number) => <TeamIcon name={organization.name} />,
      })),
    [organizations]
  );

  const [selectedTeam, setSelectedTeam] = useState<Team>(
    teams.find((team) => team.id === id) ?? teams[0]
  );

  const users = Array.isArray(props.users)
    ? props.users
    : props.users[selectedTeam.document] ?? [];

  const projects = Array.isArray(props.projects)
    ? props.projects
    : props.projects[selectedTeam.document] ?? [];

  return (
    <Form
      className="flex flex-col space-y-6 h-full"
      method="post"
      onKeyUp={(event) => {
        if (event.key === "Enter") {
          props.onClose();
          submit(event.currentTarget);
        }
      }}
      onSubmit={() => props.onClose()}
    >
      <div className="flex flex-col space-y-2">
        <TextInput name="title" placeholder="Issue title" autoFocus />
        <div className="flex justify-between">
          <div className="flex space-x-1">
            {id ? (
              <input type="hidden" value={selectedTeam.document} name="team" />
            ) : (
              <TeamSelect
                items={teams}
                onChange={(team: Team) => {
                  setSelectedTeam(team);
                }}
                value={selectedTeam}
              />
            )}
            {projects.length > 0 && (
              <ProjectSelect projects={projects} defaultValue={projectid} />
            )}
            <IssueDetails
              users={users}
              defaultAssignee={props.defaultAssignee}
            />
          </div>
        </div>
      </div>
      <div className="flex-grow">
        <textarea
          className="px-0.5 w-full h-full bg-transparent text-zinc-300 resize-none outline-none text-base"
          placeholder="Add description..."
          name="body"
        />
      </div>
      <div className="flex justify-end space-x-4">
        <OutlineButton type="button" onClick={props.onClose}>
          Cancel
        </OutlineButton>
        <PrimaryButton>Save</PrimaryButton>
      </div>
    </Form>
  );
}
