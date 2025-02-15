import Select from "~/components/select";
import { Package, PackageX } from "lucide-react";
import { useAuth } from "~/context/auth.context";

export default function ProjectSelect(props) {
  const { auth } = useAuth();

  if (auth === null || auth === undefined) {
    return null;
  }

  return (
    <Select
      name="project_id"
      {...props}
      items={[
        {
          id: null,
          name: "No project",
          icon: () => <PackageX size={16} />,
        },
        ...(props.projects?.map((item) => ({
          id: item.id,
          name: item.name,
          icon: () => <Package size={16} />,
        })) ?? []),
      ]}
    />
  );
}
