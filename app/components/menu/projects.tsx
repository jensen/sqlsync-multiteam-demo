import { useEffect, useState } from "react";
import { Box } from "lucide-react";
import { usePopper } from "react-popper";

interface ProjectsMenuProps {
  referenceElement: HTMLButtonElement;
  projects: {
    id: string;
    name: string;
  }[];
  onSelect: (id: string) => void;
}

export default function ProjectsMenu(props: ProjectsMenuProps) {
  const [referenceElement, setReferenceElement] =
    useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
    null
  );

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: `left-start`,
    modifiers: [
      {
        name: "offset",
        options: {
          offset: [-8, -4],
        },
      },
    ],
  });

  useEffect(() => {
    setReferenceElement(props.referenceElement);
  }, [props.referenceElement]);

  return (
    <div ref={setPopperElement} style={styles.popper} {...attributes.popper}>
      <ul className="min-w-36 bg-zinc-800 rounded shadow-menu px-1 py-2 space-y-1">
        {props.projects.map((project) => (
          <li key={project.id}>
            <button
              className="w-full rounded flex items-center space-x-1 pl-1.5 pr-6 py-1 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700 cursor-default"
              onClick={(event) => {
                event.stopPropagation();
                props.onSelect(project.id);
              }}
            >
              <Box size={14} />
              <span className="text-sm text-nowrap">{project.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
