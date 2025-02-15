import {
  ReactElement,
  useEffect,
  useState,
  useRef,
  forwardRef,
  type PropsWithChildren,
  type RefObject,
  type ReactNode,
} from "react";
import { usePopper } from "react-popper";
import clsx from "clsx";
import { Ellipsis } from "lucide-react";
import { insideRect, outsideRect } from "~/lib/shape";

interface MenuProps {
  items: {
    id: string;
    label: string;
    icon: ReactElement;
    onClick?: () => void;
    sub?: (ref: RefObject<HTMLButtonElement>) => ReactNode;
  }[];
  side?: "left" | "right";
}

export default forwardRef<() => void, PropsWithChildren<MenuProps>>(
  function Menu(props, ref) {
    const side = props.side ?? "left";

    const [highlightedIndex, setHighlightedIndex] = useState<number | null>(
      null
    );
    const [open, setOpen] = useState(false);

    const [referenceElement, setReferenceElement] =
      useState<HTMLButtonElement | null>(null);
    const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
      null
    );

    const subMenuRef = useRef<HTMLButtonElement>(null);

    const totalItems = props.items.length ?? 0;

    const { styles, attributes } = usePopper(referenceElement, popperElement, {
      placement: `${side}-start`,
      modifiers: [
        {
          name: "offset",
          options: {
            offset: [8, -4],
          },
        },
      ],
    });

    useEffect(() => {
      if (ref) {
        ref.current = setOpen;
      }
    }, [ref]);

    useEffect(() => {
      if (open && referenceElement) {
        const handler = (event: KeyboardEvent) => {
          if (event.key === "Escape") {
            setOpen(false);
            setHighlightedIndex(null);
          }
        };

        document.addEventListener("keydown", handler);
        document.addEventListener("keyup", handler);

        return () => {
          document.removeEventListener("keydown", handler);
          document.removeEventListener("keyup", handler);
        };
      }
    }, [open, referenceElement]);

    useEffect(() => {
      if (open && referenceElement) {
        const handler = (event: KeyboardEvent) => {
          if (event.key === "ArrowUp") {
            setHighlightedIndex((prev) => {
              if (prev === null) return totalItems;

              return (prev - 1 + totalItems) % totalItems;
            });
          }

          if (event.key === "ArrowDown") {
            setHighlightedIndex((prev) => {
              if (prev === null) return 0;

              return (prev + 1 + totalItems) % totalItems;
            });
          }

          if (event.key === "Tab") {
            event.preventDefault();

            setHighlightedIndex((prev) => {
              if (prev === null) return 0;

              return (
                (prev + (event.shiftKey ? -1 : 1) + totalItems) % totalItems
              );
            });
          }
        };

        document.addEventListener("keydown", handler);

        return () => {
          document.removeEventListener("keydown", handler);
        };
      }
    }, [totalItems, open, referenceElement]);

    useEffect(() => {
      if (open && popperElement) {
        const handler = (event: MouseEvent) => {
          const rect = referenceElement?.getBoundingClientRect();
          const { clientX, clientY } = event;

          if (
            rect &&
            outsideRect({ x: clientX, y: clientY }, rect) &&
            insideRect({ x: clientX, y: clientY }, rect) === false
          ) {
            event.preventDefault();
            event.stopPropagation();

            setOpen(false);
            setHighlightedIndex(null);
          }
        };

        document.addEventListener("click", handler);

        return () => {
          document.removeEventListener("click", handler);
        };
      }
    }, [open, popperElement, referenceElement]);

    return (
      <div className="relative">
        <button
          type="button"
          ref={setReferenceElement}
          className={clsx(
            "group p-2 flex items-center space-x-1 text-zinc-400 hover:text-zinc-300 outline-none cursor-default"
          )}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setOpen((prev) => !prev);
          }}
        >
          <div
            className={clsx(
              "p-1 group-hover:bg-zinc-800 transition-all duration-150 rounded",
              open && "bg-zinc-800 text-zinc-300"
            )}
          >
            <Ellipsis size={16} />
          </div>
        </button>
        <div
          ref={setPopperElement}
          style={styles.popper}
          className={clsx(
            "z-50 bg-zinc-800 shadow-menu rounded w-40 px-1 py-1.5 transition-opacity duration-150 ease-in flex flex-col",
            open ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          {...attributes.popper}
        >
          <ul className="space-y-1">
            {props.items.map((item, index) => (
              <li key={item.id} className="relative text-zinc-400">
                <button
                  ref={item.sub ? subMenuRef : undefined}
                  className={clsx(
                    "group w-full rounded px-1.5 py-1 flex items-center space-x-2 hover:bg-zinc-700 cursor-default",
                    highlightedIndex === index && "bg-zinc-700"
                  )}
                  onClick={(event) => {
                    event.stopPropagation();
                    item.onClick();
                  }}
                  onMouseOver={() => {
                    setHighlightedIndex(index);
                  }}
                >
                  {item.icon}
                  <span
                    className={clsx(
                      "text-sm group-hover:text-zinc-300",
                      highlightedIndex === index && "text-zinc-300"
                    )}
                  >
                    {item.label}
                  </span>
                </button>
                {highlightedIndex === index &&
                  typeof item.sub === "function" &&
                  item.sub(subMenuRef.current)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
);
