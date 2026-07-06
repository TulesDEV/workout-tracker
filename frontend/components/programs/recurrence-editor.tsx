"use client";

import { useState } from "react";
import { formatDateOnly } from "@/lib/recurrence";
import { WEEKDAY_LABELS } from "@/lib/types";
import type { Program, RecurrenceType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { cn } from "@/lib/cn";

export function RecurrenceEditor({
  program,
  onSave,
  onCancel,
}: {
  program: Pick<
    Program,
    "recurrence_type" | "weekdays" | "interval_days" | "anchor_date"
  >;
  onSave: (data: Pick<Program, "recurrence_type" | "weekdays" | "interval_days" | "anchor_date">) => Promise<void>;
  onCancel: () => void;
}) {
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(
    program.recurrence_type
  );
  const [weekdays, setWeekdays] = useState<number[]>(program.weekdays);
  const [intervalDays, setIntervalDays] = useState(
    program.interval_days?.toString() ?? "3"
  );
  const [anchorDate, setAnchorDate] = useState(
    program.anchor_date ?? formatDateOnly(new Date())
  );
  const [saving, setSaving] = useState(false);

  function toggleWeekday(day: number) {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  async function submit() {
    setSaving(true);
    try {
      await onSave({
        recurrence_type: recurrenceType,
        weekdays: recurrenceType === "weekly" ? weekdays : [],
        interval_days: recurrenceType === "interval" ? Number(intervalDays) : null,
        anchor_date: recurrenceType === "interval" ? anchorDate : null,
      });
    } finally {
      setSaving(false);
    }
  }

  const canSave =
    recurrenceType === "weekly" ? weekdays.length > 0 : Number(intervalDays) > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label>Recurrence</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRecurrenceType("weekly")}
            className={cn(
              "flex-1 rounded-xl border border-border py-2 text-sm font-medium",
              recurrenceType === "weekly" && "bg-accent border-transparent"
            )}
          >
            Specific days
          </button>
          <button
            type="button"
            onClick={() => setRecurrenceType("interval")}
            className={cn(
              "flex-1 rounded-xl border border-border py-2 text-sm font-medium",
              recurrenceType === "interval" && "bg-accent border-transparent"
            )}
          >
            Every N days
          </button>
        </div>
      </div>

      {recurrenceType === "weekly" ? (
        <div className="flex flex-wrap gap-1.5">
          {WEEKDAY_LABELS.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => toggleWeekday(index)}
              className={cn(
                "rounded-full border border-border px-3 py-1.5 text-xs font-medium",
                weekdays.includes(index) && "bg-accent border-transparent"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label>Every</Label>
            <Input
              type="number"
              min={1}
              value={intervalDays}
              onChange={(e) => setIntervalDays(e.target.value)}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label>Starting</Label>
            <Input
              type="date"
              value={anchorDate}
              onChange={(e) => setAnchorDate(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={!canSave || saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
