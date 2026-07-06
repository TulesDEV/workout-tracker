"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { api, getErrorMessage } from "@/lib/api";
import { formatFriendlyDate } from "@/lib/recurrence";
import type { Exercise, SetEntry } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryBadge, StatusBadge } from "@/components/ui/badge";
import { ErrorMessage } from "@/components/ui/error-message";
import { Textarea } from "@/components/ui/input";

interface ExerciseGroup {
  exercise: Exercise | null;
  order: number;
  entries: SetEntry[];
}

export function SessionTracker({ sessionId }: { sessionId: number }) {
  const router = useRouter();
  const key = `session-${sessionId}`;
  const { data: session, mutate } = useSWR(key, () =>
    api.sessions.get(sessionId)
  );
  const [completing, setCompleting] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const groups = useMemo<ExerciseGroup[]>(() => {
    if (!session) return [];
    const map = new Map<string, ExerciseGroup>();
    for (const entry of session.set_entries) {
      const key = entry.exercise ? String(entry.exercise) : `unknown-${entry.id}`;
      if (!map.has(key)) {
        map.set(key, { exercise: entry.exercise_detail, order: entry.order, entries: [] });
      }
      map.get(key)!.entries.push(entry);
    }
    return [...map.values()].sort((a, b) => a.order - b.order);
  }, [session]);

  if (!session) {
    return <p className="text-sm text-muted">Loading...</p>;
  }

  const readOnly = session.status === "completed";

  async function updateEntry(entry: SetEntry, data: Partial<SetEntry>) {
    setError(null);
    try {
      await api.setEntries.update(entry.id, data);
      mutate();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function addSet(group: ExerciseGroup) {
    if (!group.exercise) return;
    setError(null);
    try {
      const nextSetNumber =
        Math.max(...group.entries.map((e) => e.set_number), 0) + 1;
      await api.setEntries.create({
        session: session!.id,
        exercise: group.exercise.id,
        order: group.order,
        set_number: nextSetNumber,
      });
      mutate();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function removeSet(entry: SetEntry) {
    setError(null);
    try {
      await api.setEntries.remove(entry.id);
      mutate();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function saveNotes() {
    if (notes === null) return;
    setError(null);
    try {
      await api.sessions.update(session!.id, { notes });
      mutate();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function complete() {
    setCompleting(true);
    setError(null);
    try {
      await api.sessions.complete(session!.id);
      await mutate();
      router.push("/history");
    } catch (err) {
      setError(getErrorMessage(err));
      setCompleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-muted">{formatFriendlyDate(session.date)}</p>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {session.program_name}
          </h1>
          <StatusBadge status={session.status} />
        </div>
      </div>

      <ErrorMessage message={error} />

      <div className="flex flex-col gap-4">
        {groups.map((group) => (
          <Card key={group.exercise?.id ?? group.order} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="font-medium">{group.exercise?.name ?? "Unknown exercise"}</p>
              {group.exercise && <CategoryBadge category={group.exercise.category} />}
            </div>

            <div className="flex flex-col gap-2">
              {group.entries
                .sort((a, b) => a.set_number - b.set_number)
                .map((entry) => (
                  <SetRow
                    key={entry.id}
                    entry={entry}
                    readOnly={readOnly}
                    onChange={(data) => updateEntry(entry, data)}
                    onRemove={() => removeSet(entry)}
                  />
                ))}
            </div>

            {!readOnly && (
              <Button size="sm" variant="ghost" onClick={() => addSet(group)}>
                + Add set
              </Button>
            )}
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-muted">Notes</label>
        <Textarea
          rows={3}
          defaultValue={session.notes}
          disabled={readOnly}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
          placeholder="How did it feel?"
        />
      </div>

      {!readOnly && (
        <Button onClick={complete} disabled={completing}>
          {completing ? "Finishing..." : "Complete Workout"}
        </Button>
      )}
    </div>
  );
}

function SetRow({
  entry,
  readOnly,
  onChange,
  onRemove,
}: {
  entry: SetEntry;
  readOnly: boolean;
  onChange: (data: Partial<SetEntry>) => void;
  onRemove: () => void;
}) {
  const [reps, setReps] = useState(entry.reps?.toString() ?? "");
  const [weight, setWeight] = useState(entry.weight_kg ?? "");

  return (
    <div className="flex items-center gap-2">
      <span className="w-5 text-center text-xs font-medium text-muted">
        {entry.set_number}
      </span>
      <input
        type="number"
        inputMode="numeric"
        placeholder="reps"
        className="w-16 rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-accent-strong/50"
        value={reps}
        disabled={readOnly}
        onChange={(e) => setReps(e.target.value)}
        onBlur={() => onChange({ reps: reps === "" ? null : Number(reps) })}
      />
      <span className="text-xs text-muted">reps</span>
      <input
        type="number"
        inputMode="decimal"
        placeholder="kg"
        className="w-16 rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-accent-strong/50"
        value={weight}
        disabled={readOnly}
        onChange={(e) => setWeight(e.target.value)}
        onBlur={() => onChange({ weight_kg: weight === "" ? null : weight })}
      />
      <span className="text-xs text-muted">kg</span>
      <button
        type="button"
        disabled={readOnly}
        onClick={() => onChange({ completed: !entry.completed })}
        className={`ml-auto flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
          entry.completed
            ? "border-transparent bg-success text-success-foreground"
            : "border-border text-muted"
        }`}
        aria-label={entry.completed ? "Mark set incomplete" : "Mark set complete"}
      >
        ✓
      </button>
      {!readOnly && (
        <button
          type="button"
          onClick={onRemove}
          className="text-muted hover:text-red-500"
          aria-label="Remove set"
        >
          ×
        </button>
      )}
    </div>
  );
}
