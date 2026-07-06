"use client";

import { useState } from "react";
import useSWR from "swr";
import { api, getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function AddProgramExercise({
  programId,
  nextOrder,
  onAdded,
  onCancel,
}: {
  programId: number;
  nextOrder: number;
  onAdded: () => void;
  onCancel: () => void;
}) {
  const { data: exercises } = useSWR("exercises", () => api.exercises.list());
  const [exerciseId, setExerciseId] = useState<string>("");
  const [sets, setSets] = useState("3");
  const [repsMin, setRepsMin] = useState("8");
  const [repsMax, setRepsMax] = useState("12");
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!exerciseId) return;
    setSaving(true);
    setError(null);
    try {
      await api.programExercises.create({
        program: programId,
        exercise: Number(exerciseId),
        order: nextOrder,
        target_sets: Number(sets),
        target_reps_min: Number(repsMin),
        target_reps_max: repsMax ? Number(repsMax) : null,
        target_weight_kg: weight || null,
      });
      onAdded();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-dashed border-border p-3">
      <div className="flex flex-col gap-1.5">
        <Label>Exercise</Label>
        <Select value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
          <option value="">Select an exercise...</option>
          {exercises?.map((exercise) => (
            <option key={exercise.id} value={exercise.id}>
              {exercise.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex gap-2">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label>Sets</Label>
          <Input
            type="number"
            min={1}
            value={sets}
            onChange={(e) => setSets(e.target.value)}
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label>Reps min</Label>
          <Input
            type="number"
            min={1}
            value={repsMin}
            onChange={(e) => setRepsMin(e.target.value)}
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label>Reps max</Label>
          <Input
            type="number"
            min={1}
            value={repsMax}
            onChange={(e) => setRepsMax(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Target weight (kg, optional)</Label>
        <Input
          type="number"
          step="0.5"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
      </div>

      <ErrorMessage message={error} />

      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={!exerciseId || saving}>
          {saving ? "Adding..." : "Add"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {exercises?.length === 0 && (
        <p className="text-xs text-muted">
          No exercises in your library yet — add some from the Exercises tab first.
        </p>
      )}
    </div>
  );
}
