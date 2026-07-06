"use client";

import { useState } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { EXERCISE_CATEGORIES } from "@/lib/types";
import type { Exercise, ExerciseCategory } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/cn";

export function ExerciseList() {
  const { data: exercises, mutate } = useSWR("exercises", () => api.exercises.list());
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<ExerciseCategory | "all">("all");

  const visible = exercises?.filter((e) => filter === "all" || e.category === filter);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Exercises</h1>
        <Button size="sm" variant="secondary" onClick={() => setCreating((v) => !v)}>
          {creating ? "Cancel" : "+ New"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-full border border-border px-3 py-1.5 text-xs font-medium",
            filter === "all" && "bg-accent border-transparent"
          )}
        >
          All
        </button>
        {EXERCISE_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilter(cat.value)}
            className={cn(
              "rounded-full border border-border px-3 py-1.5 text-xs font-medium",
              filter === cat.value && "bg-accent border-transparent"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {creating && (
        <ExerciseForm
          onSaved={() => {
            setCreating(false);
            mutate();
          }}
          onCancel={() => setCreating(false)}
        />
      )}

      {visible?.length === 0 && !creating && (
        <EmptyState
          title="No exercises found"
          description="Add exercises to your library to use them in programs."
        />
      )}

      <div className="flex flex-col gap-2">
        {visible?.map((exercise) => (
          <ExerciseRow key={exercise.id} exercise={exercise} onMutate={mutate} />
        ))}
      </div>
    </div>
  );
}

function ExerciseRow({
  exercise,
  onMutate,
}: {
  exercise: Exercise;
  onMutate: () => void;
}) {
  const [editing, setEditing] = useState(false);

  async function remove() {
    if (!confirm(`Delete "${exercise.name}"?`)) return;
    await api.exercises.remove(exercise.id);
    onMutate();
  }

  if (editing) {
    return (
      <ExerciseForm
        exercise={exercise}
        onSaved={() => {
          setEditing(false);
          onMutate();
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <Card className="flex items-center justify-between gap-2">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{exercise.name}</p>
          <CategoryBadge category={exercise.category} />
        </div>
        {exercise.equipment && (
          <p className="text-xs text-muted">{exercise.equipment}</p>
        )}
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
          Edit
        </Button>
        <Button size="sm" variant="danger" onClick={remove}>
          Delete
        </Button>
      </div>
    </Card>
  );
}

function ExerciseForm({
  exercise,
  onSaved,
  onCancel,
}: {
  exercise?: Exercise;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(exercise?.name ?? "");
  const [category, setCategory] = useState<ExerciseCategory>(
    exercise?.category ?? "full_body"
  );
  const [equipment, setEquipment] = useState(exercise?.equipment ?? "");
  const [notes, setNotes] = useState(exercise?.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const data = { name, category, equipment, notes };
      if (exercise) {
        await api.exercises.update(exercise.id, data);
      } else {
        await api.exercises.create(data);
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label>Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Category</Label>
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value as ExerciseCategory)}
        >
          {EXERCISE_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Equipment (optional)</Label>
        <Input value={equipment} onChange={(e) => setEquipment(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Notes (optional)</Label>
        <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={!name.trim() || saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}
