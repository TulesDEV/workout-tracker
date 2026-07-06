"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { api, getErrorMessage } from "@/lib/api";
import { describeRecurrence } from "@/lib/recurrence";
import type { Program } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryBadge } from "@/components/ui/badge";
import { ErrorMessage } from "@/components/ui/error-message";
import { Input, Textarea } from "@/components/ui/input";
import { AddProgramExercise } from "@/components/programs/add-program-exercise";
import { RecurrenceEditor } from "@/components/programs/recurrence-editor";

export function ProgramDetail({ programId }: { programId: number }) {
  const router = useRouter();
  const key = `program-${programId}`;
  const { data: program, mutate } = useSWR(key, () => api.programs.get(programId));
  const [editingDetails, setEditingDetails] = useState(false);
  const [editingRecurrence, setEditingRecurrence] = useState(false);
  const [addingExercise, setAddingExercise] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!program) {
    return <p className="text-sm text-muted">Loading...</p>;
  }

  const sortedExercises = [...program.exercises].sort((a, b) => a.order - b.order);

  function startEditing() {
    setName(program!.name);
    setDescription(program!.description);
    setEditingDetails(true);
  }

  async function saveDetails() {
    setError(null);
    try {
      await api.programs.update(program!.id, { name, description });
      setEditingDetails(false);
      mutate();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function saveRecurrence(
    data: Pick<Program, "recurrence_type" | "weekdays" | "interval_days" | "anchor_date">
  ) {
    setError(null);
    try {
      await api.programs.update(program!.id, data);
      setEditingRecurrence(false);
      mutate();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function toggleActive() {
    setError(null);
    try {
      if (program!.is_active) {
        await api.programs.deactivate(program!.id);
      } else {
        await api.programs.activate(program!.id);
      }
      mutate();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function removeProgram() {
    if (!confirm(`Delete "${program!.name}"?`)) return;
    setError(null);
    try {
      await api.programs.remove(program!.id);
      router.push("/programs");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function removeExercise(id: number) {
    setError(null);
    try {
      await api.programExercises.remove(id);
      mutate();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const target = sortedExercises[index + direction];
    const current = sortedExercises[index];
    if (!target) return;
    setError(null);
    try {
      await Promise.all([
        api.programExercises.update(current.id, { order: target.order }),
        api.programExercises.update(target.id, { order: current.order }),
      ]);
      mutate();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <ErrorMessage message={error} />

      {editingDetails ? (
        <Card className="flex flex-col gap-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={saveDetails}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditingDetails(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      ) : (
        <div onClick={startEditing} className="cursor-pointer">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{program.name}</h1>
            {program.is_active && (
              <span className="rounded-full bg-success px-2.5 py-1 text-xs font-medium text-success-foreground">
                Active
              </span>
            )}
          </div>
          {program.description && (
            <p className="text-sm text-muted">{program.description}</p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          variant={program.is_active ? "ghost" : "secondary"}
          onClick={toggleActive}
        >
          {program.is_active ? "Deactivate" : "Activate"}
        </Button>
        <Button size="sm" variant="danger" className="ml-auto" onClick={removeProgram}>
          Delete Program
        </Button>
      </div>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted">Recurrence</h2>
          {!editingRecurrence && (
            <Button size="sm" variant="ghost" onClick={() => setEditingRecurrence(true)}>
              Edit
            </Button>
          )}
        </div>
        {editingRecurrence ? (
          <RecurrenceEditor
            program={program}
            onSave={saveRecurrence}
            onCancel={() => setEditingRecurrence(false)}
          />
        ) : (
          <p className="text-sm">{describeRecurrence(program)}</p>
        )}
      </Card>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted">Exercises</h2>
          <Button size="sm" variant="ghost" onClick={() => setAddingExercise((v) => !v)}>
            {addingExercise ? "Cancel" : "+ Add exercise"}
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          {sortedExercises.map((programExercise, index) => (
            <Card
              key={programExercise.id}
              className="flex items-center gap-2 bg-background"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">
                    {programExercise.exercise_detail.name}
                  </p>
                  <CategoryBadge category={programExercise.exercise_detail.category} />
                </div>
                <p className="text-xs text-muted">
                  {programExercise.target_sets} sets × {programExercise.target_reps_min}
                  {programExercise.target_reps_max
                    ? `-${programExercise.target_reps_max}`
                    : ""}{" "}
                  reps
                  {programExercise.target_weight_kg
                    ? ` @ ${programExercise.target_weight_kg}kg`
                    : ""}
                </p>
              </div>
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  className="text-muted disabled:opacity-20"
                  aria-label="Move up"
                >
                  ▲
                </button>
                <button
                  type="button"
                  disabled={index === sortedExercises.length - 1}
                  onClick={() => move(index, 1)}
                  className="text-muted disabled:opacity-20"
                  aria-label="Move down"
                >
                  ▼
                </button>
              </div>
              <button
                type="button"
                onClick={() => removeExercise(programExercise.id)}
                className="text-muted hover:text-red-500"
                aria-label="Remove exercise"
              >
                ×
              </button>
            </Card>
          ))}
        </div>

        {addingExercise && (
          <AddProgramExercise
            programId={program.id}
            nextOrder={sortedExercises.length}
            onAdded={() => {
              setAddingExercise(false);
              mutate();
            }}
            onCancel={() => setAddingExercise(false)}
          />
        )}
      </div>
    </div>
  );
}
