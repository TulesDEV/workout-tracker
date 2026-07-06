"use client";

import Link from "next/link";
import useSWR from "swr";
import { api } from "@/lib/api";
import { formatFriendlyDate } from "@/lib/recurrence";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/badge";

export function HistoryList() {
  const { data: sessions } = useSWR("all-sessions", () => api.sessions.list());

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">History</h1>

      {sessions?.length === 0 && (
        <EmptyState
          title="No workouts logged yet"
          description="Sessions you start from the Today tab will show up here."
        />
      )}

      <div className="flex flex-col gap-2">
        {sessions?.map((session) => (
          <Link key={session.id} href={`/session/${session.id}`}>
            <Card className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">
                  {session.program_name}
                </p>
                <p className="text-xs text-muted">
                  {formatFriendlyDate(session.date)} · {session.set_entries.length} sets
                </p>
              </div>
              <StatusBadge status={session.status} />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
