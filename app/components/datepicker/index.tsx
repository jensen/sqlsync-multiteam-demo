import { Modal, useModal } from "../shared/modal";
import { useState, useEffect } from "react";
import { clsx } from "clsx";

function generateDays(month: number, year: number) {
  const startDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const prevMonthDays = startDay;
  const nextMonthDays = (7 - ((startDay + daysInMonth) % 7)) % 7;
  const totalDays = prevMonthDays + daysInMonth + nextMonthDays;

  const getDayDate = (index: number) => {
    if (index < prevMonthDays) {
      return new Date(year, month - 2, index - prevMonthDays + 1);
    } else if (index >= prevMonthDays + daysInMonth) {
      return new Date(year, month, index - (prevMonthDays + daysInMonth) + 1);
    } else {
      return new Date(year, month - 1, index - prevMonthDays + 1);
    }
  };

  return Array.from({ length: totalDays }, (_, index) => getDayDate(index));
}

export default function DatePicker() {
  const { open, close, ...modalProps } = useModal();

  const today = new Date();

  const [selected, setSelected] = useState<Date | null>(null);
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  useEffect(() => {}, [open]);

  const days = generateDays(month, year);

  return (
    <Modal {...modalProps}>
      <div className="p-3 h-full flex items-center justify-end">
        <div className="bg-zinc-800 p-2 rounded border border-zinc-700 grid grid-cols-7 w-max gap-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, index) => (
            <div
              key={index}
              className="size-5 flex items-center justify-center"
            >
              <span className="text-xs font-bold select-none text-zinc-400">
                {d}
              </span>
            </div>
          ))}
          {days.map((day) => {
            const isSelected =
              (selected &&
                selected.getMonth() === day.getMonth() &&
                selected.getDate() === day.getDate()) ??
              false;

            return (
              <button
                key={day.toString()}
                className={clsx(
                  "size-5 flex items-center justify-center rounded-full outline-none",
                  "hover:bg-zinc-700",
                  {
                    "bg-zinc-600": isSelected,
                  }
                )}
                onClick={() => setSelected(day)}
              >
                <span
                  className={clsx(
                    "text-xs select-none",
                    { "font-bold": isSelected },
                    today.getMonth() === day.getMonth() &&
                      today.getDate() === day.getDate()
                      ? isSelected
                        ? "text-violet-300"
                        : "text-violet-500"
                      : today.getTime() > day.getTime() ||
                        day.getMonth() > today.getMonth()
                      ? "text-zinc-400"
                      : "text-zinc-300"
                  )}
                >
                  {day.getDate()}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
