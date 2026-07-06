"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { api, getErrorMessage } from "@/lib/api";
import { describeRecurrence } from "@/lib/recurrence";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorMessage } from "@/components/ui/error-message";
import { Input, Textarea } from "@/components/ui/input";

export function ProgramList() {
  const { data: programs, mutate } = useSWR("programs", () => api.programs.list());
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  async function createProgram() {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.programs.create({ name, description });
      setName("");
      setDescription("");
      setCreating(false);
      mutate();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(id: number, isActive: boolean) {
    setRowError(null);
    try {
      if (isActive) {
        await api.programs.deactivate(id);
      } else {
        await api.programs.activate(id);
      }
      mutate();
    } catch (err) {
      setRowError(getErrorMessage(err));
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this program?")) return;
    setRowError(null);
    try {
      await api.programs.remove(id);
      mutate();
    } catch (err) {
      setRowError(getErrorMessage(err));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Programs</h1>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setCreating((v) => !v);
            setError(null);
          }}
        >
          {creating ? "Cancel" : "+ New"}
        </Button>
      </div>

      {creating && (
        <Card className="flex flex-col gap-3">
          <Input
            placeholder="Program name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Textarea
            placeholder="Description (optional)"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <ErrorMessage message={error} />
          <Button size="sm" onClick={createProgram} disabled={saving || !name.trim()}>
            {saving ? "Creating..." : "Create Program"}
          </Button>
        </Card>
      )}

      {programs && programs.length === 0 && !creating && (
        <EmptyState
          title="No programs yet"
          description="Create a program, give it a recurrence, and activate it to start tracking."
        />
      )}

      <ErrorMessage message={rowError} />

      <div className="flex flex-col gap-3">
        {programs?.map((program) => (
          <Card key={program.id} className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link href={`/programs/${program.id}`} className="font-medium">
                  {program.name}
                </Link>
                {program.description && (
                  <p className="text-xs text-muted">{program.description}</p>
                )}
                <p className="mt-1 text-xs text-muted">{describeRecurrence(program)}</p>
                <p className="text-xs text-muted">
                  {program.exercises.length} exercise
                  {program.exercises.length === 1 ? "" : "s"}
                </p>
              </div>
              {program.is_active && (
                <span className="rounded-full bg-success px-2.5 py-1 text-xs font-medium text-success-foreground">
                  Active
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={program.is_active ? "ghost" : "secondary"}
                onClick={() => toggleActive(program.id, program.is_active)}
              >
                {program.is_active ? "Deactivate" : "Activate"}
              </Button>
              <Link href={`/programs/${program.id}`}>
                <Button size="sm" variant="ghost">
                  Manage
                </Button>
              </Link>
              <Button
                size="sm"
                variant="danger"
                className="ml-auto"
                onClick={() => remove(program.id)}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
