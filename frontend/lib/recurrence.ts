import type { Program } from "./types";
import { WEEKDAY_LABELS } from "./types";

/** Mirrors Program.is_due_on on the backend (workouts/models.py). */
export function isProgramDueOn(program: Program, date: Date): boolean {
  if (program.recurrence_type === "weekly") {
    const weekday = (date.getDay() + 6) % 7; // JS: 0=Sun -> ours: 0=Mon
    return program.weekdays.includes(weekday);
  }
  if (program.recurrence_type === "interval") {
    if (!program.interval_days || !program.anchor_date) return false;
    const anchor = parseDateOnly(program.anchor_date);
    const deltaDays = Math.round(
      (startOfDay(date).getTime() - startOfDay(anchor).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return deltaDays >= 0 && deltaDays % program.interval_days === 0;
  }
  return false;
}

export function describeRecurrence(program: Program): string {
  if (program.recurrence_type === "weekly") {
    if (!program.weekdays.length) return "No days selected";
    return [...program.weekdays]
      .sort((a, b) => a - b)
      .map((day) => WEEKDAY_LABELS[day])
      .join(", ");
  }
  if (program.interval_days) {
    return program.interval_days === 1
      ? "Every day"
      : `Every ${program.interval_days} days`;
  }
  return "Not configured";
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatFriendlyDate(value: string): string {
  const date = parseDateOnly(value);
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
