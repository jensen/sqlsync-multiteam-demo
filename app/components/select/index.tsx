import { ReactElement, useEffect, useCallback, useState } from "react";
import { usePopper } from "react-popper";
import clsx from "clsx";
import { Check, CircleUserRound } from "lucide-react";
import { insideRect, outsideRect } from "~/lib/shape";
import { TextInput } from "../shared/input";
import UserIcon from "../shared/user-icon";

interface SelectProps {
  name: string;
  items?: {
    id: string | null;
    name: string;
    icon?: ReactElement | ((size: number) => ReactElement);
  }[];
  defaultValue?: string | number;
  defaultLabel?: string;
  onChange?: (value: string | null) => void;
  value?: {
    id: string | null;
    name: string;
    icon?: ReactElement | ((size: number) => ReactElement);
  };
}

export default function Select(props: SelectProps) {
  const item =
    props.items?.find(({ id }) => String(id) === String(props.defaultValue))
      ?.id ?? null;
  const [selectedItem, setSelectedItem] = useState<string | null>(item);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const [referenceElement, setReferenceElement] =
    useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
    null
  );

  const currentItem = props.items?.find((item) => item.id === selectedItem);

  const list =
    props.items?.filter(({ name }) =>
      name.toLowerCase().includes(query.toLowerCase())
    ) ?? [];

  const totalItems = list.length;

  const highlightedItem =
    props.items && highlightedIndex !== null
      ? props.items[highlightedIndex].id
      : undefined;

  const { styles, attributes, forceUpdate } = usePopper(
    referenceElement,
    popperElement,
    {
      placement: "bottom-start",
      modifiers: [
        {
          name: "offset",
          options: {
            offset: [0, 2],
          },
        },
      ],
    }
  );

  const { onChange } = props;

  const selectItem = useCallback(
    (id: string | null) => {
      setSelectedItem(id);
      setOpen(false);
      setHighlightedIndex(null);

      if (onChange) {
        onChange(id);
      }
    },
    [onChange]
  );

  useEffect(() => {
    if (item !== undefined) {
      setSelectedItem(item);
    }
  }, [item]);

  useEffect(() => {
    if (props.items) {
      const item = props.items.find(({ id }) => selectedItem === id);

      if (item === undefined) {
        setSelectedItem(null);
      }
    }
  }, [props.items, selectedItem]);

  useEffect(() => {
    if (open && referenceElement) {
      const handler = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setOpen(false);
          setQuery("");
          setHighlightedIndex(null);
        }

        if (event.key === "Enter" && highlightedItem !== undefined) {
          selectItem(highlightedItem);
        }
      };

      document.addEventListener("keydown", handler);
      document.addEventListener("keyup", handler);

      return () => {
        document.removeEventListener("keydown", handler);
        document.removeEventListener("keyup", handler);
      };
    }
  }, [open, referenceElement, selectItem, highlightedItem]);

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

            return (prev + (event.shiftKey ? -1 : 1) + totalItems) % totalItems;
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
      {selectedItem && (
        <input
          type="hidden"
          name={props.name}
          defaultValue={
            props.items.find(({ id }) => id === selectedItem).document ??
            selectedItem
          }
        />
      )}
      <button
        type="button"
        ref={setReferenceElement}
        className={clsx(
          "group border border-zinc-800 rounded px-2 py-0.5 flex items-center space-x-1 hover:bg-zinc-900 cursor-default",
          "outline-none focus:ring-1 focus:ring-indigo-700 active:ring-0"
        )}
        onClick={() => {
          setOpen((prev) => !prev);
          if (forceUpdate) {
            forceUpdate();
          }
        }}
      >
        {currentItem && currentItem.id === null ? (
          <span className="text-zinc-400">{currentItem.icon(14)}</span>
        ) : currentItem?.icon && typeof currentItem.icon === "function" ? (
          currentItem.icon(14)
        ) : currentItem ? (
          <UserIcon name={currentItem.name} />
        ) : null}
        <span className="text-xs font-medium select-none text-zinc-400 group-hover:text-zinc-300">
          {currentItem?.name ?? props.defaultLabel}
        </span>
      </button>
      <div
        ref={setPopperElement}
        style={styles.popper}
        className={clsx(
          "z-20 bg-zinc-950 border border-zinc-800 rounded w-48 px-1 pb-1 transition-opacity duration-150 ease-in flex flex-col space-y-1",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        {...attributes.popper}
      >
        <div className="h-7">
          {open && (
            <TextInput
              autoFocus
              value={query}
              onChange={(event) => {
                setHighlightedIndex(null);
                setQuery(event.target.value);
              }}
            />
          )}
        </div>
        <ul>
          {list.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                className={clsx(
                  "group px-1 py-0.5 w-full rounded-sm outline-none flex items-center justify-between cursor-default",
                  "outline-none",
                  highlightedIndex === index && "bg-zinc-900"
                )}
                tabIndex={open ? undefined : -1}
                onMouseOver={() => setHighlightedIndex(index)}
                onClick={(event) => {
                  event.stopPropagation();
                  selectItem(item.id);
                }}
              >
                <div className="flex items-center space-x-1">
                  {item.icon &&
                    typeof item.icon === "function" &&
                    item.icon(16)}
                  <span className="text-xs text-zinc-400 group-hover:text-zinc-100">
                    {item.name}
                  </span>
                </div>
                <div className="text-zinc-400 group-hover:text-zinc-100">
                  {selectedItem === item.id && <Check size={13} />}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
