"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { api, getErrorMessage } from "@/lib/api";
import { describeRecurrence, formatDateOnly, isProgramDueOn } from "@/lib/recurrence";
import type { Program, WorkoutSession } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorMessage } from "@/components/ui/error-message";
import { StatusBadge } from "@/components/ui/badge";

export function TodayView() {
  const router = useRouter();
  const today = formatDateOnly(new Date());
  const [startingProgramId, setStartingProgramId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: activePrograms, isLoading } = useSWR("active-programs", () =>
    api.programs.list({ is_active: true })
  );

  const { data: sessionsToday } = useSWR(["sessions-today", today], () =>
    api.sessions.list({ date: today })
  );

  if (isLoading) {
    return <p className="text-sm text-muted">Loading...</p>;
  }

  if (!activePrograms || activePrograms.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Header today={today} />
        <EmptyState
          title="No active programs"
          description="Activate a program to start tracking workouts."
          action={
            <Link href="/programs">
              <Button size="sm">Go to Programs</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const duePrograms = activePrograms.filter((program) =>
    isProgramDueOn(program, new Date())
  );

  async function startSession(program: Program) {
    setStartingProgramId(program.id);
    setError(null);
    try {
      const session = await api.sessions.create({ program: program.id });
      router.push(`/session/${session.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
      setStartingProgramId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Header today={today} />

      <ErrorMessage message={error} />

      {duePrograms.length === 0 && (
        <EmptyState
          title="Rest day"
          description="No active programs are scheduled for today."
        />
      )}

      <div className="flex flex-col gap-3">
        {duePrograms.map((program) => {
          const existing = sessionsToday?.find((s) => s.program === program.id);
          return (
            <ProgramDueCard
              key={program.id}
              program={program}
              session={existing}
              loading={startingProgramId === program.id}
              onStart={() => startSession(program)}
            />
          );
        })}
      </div>
    </div>
  );
}

function Header({ today }: { today: string }) {
  return (
    <div>
      <p className="text-sm text-muted">
        {new Date(today).toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
    </div>
  );
}

function ProgramDueCard({
  program,
  session,
  loading,
  onStart,
}: {
  program: Program;
  session?: WorkoutSession;
  loading: boolean;
  onStart: () => void;
}) {
  return (
    <Card className="flex items-center justify-between gap-3">
      <div>
        <p className="font-medium">{program.name}</p>
        <p className="text-xs text-muted">{describeRecurrence(program)}</p>
        <p className="mt-1 text-xs text-muted">
          {program.exercises.length} exercise
          {program.exercises.length === 1 ? "" : "s"}
        </p>
      </div>
      {session ? (
        <Link href={`/session/${session.id}`}>
          <Button size="sm" variant={session.status === "completed" ? "ghost" : "secondary"}>
            {session.status === "completed" ? (
              <StatusBadge status="completed" />
            ) : (
              "Continue"
            )}
          </Button>
        </Link>
      ) : (
        <Button size="sm" onClick={onStart} disabled={loading}>
          {loading ? "Starting..." : "Start"}
        </Button>
      )}
    </Card>
  );
}
