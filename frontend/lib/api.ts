import type {
  Exercise,
  Program,
  ProgramExercise,
  SetEntry,
  WorkoutSession,
} from "./types";

// Strip any trailing slash so a NEXT_PUBLIC_API_URL set with or without one
// both work - every path below already starts with its own leading slash.
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(
  /\/+$/,
  ""
);

export class ApiError extends Error {
  status: number;
  body: string;

  constructor(status: number, body: string) {
    super(`API error ${status}: ${body}`);
    this.status = status;
    this.body = body;
  }
}

/** Turns a thrown error from an `api.*` call into a short, user-facing message. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    try {
      const parsed = JSON.parse(error.body);
      const fieldErrors = Object.values(parsed).flat().join(" ");
      if (fieldErrors) return fieldErrors;
    } catch {
      // body wasn't JSON - fall through to a generic status-based message
    }
    if (error.status === 404) return "Not found.";
    if (error.status >= 500) return "Server error — please try again.";
    return `Request failed (${error.status}).`;
  }
  if (error instanceof TypeError) {
    // fetch() rejects with a TypeError for network failures and CORS blocks,
    // never reaching the ApiError path since no response comes back at all.
    return "Couldn't reach the server. Check your connection and try again.";
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new ApiError(res.status, body);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export const fetcher = <T>(path: string) => request<T>(path);

function buildQuery(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export const api = {
  exercises: {
    list: () => request<Exercise[]>("/api/exercises/"),
    create: (data: Partial<Exercise>) =>
      request<Exercise>("/api/exercises/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<Exercise>) =>
      request<Exercise>(`/api/exercises/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    remove: (id: number) =>
      request<void>(`/api/exercises/${id}/`, { method: "DELETE" }),
  },
  programs: {
    list: (params: { is_active?: boolean } = {}) =>
      request<Program[]>(`/api/programs/${buildQuery(params)}`),
    get: (id: number) => request<Program>(`/api/programs/${id}/`),
    create: (data: Partial<Program>) =>
      request<Program>("/api/programs/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<Program>) =>
      request<Program>(`/api/programs/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    remove: (id: number) =>
      request<void>(`/api/programs/${id}/`, { method: "DELETE" }),
    activate: (id: number) =>
      request<Program>(`/api/programs/${id}/activate/`, { method: "POST" }),
    deactivate: (id: number) =>
      request<Program>(`/api/programs/${id}/deactivate/`, { method: "POST" }),
  },
  programExercises: {
    create: (data: Partial<ProgramExercise>) =>
      request<ProgramExercise>("/api/program-exercises/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<ProgramExercise>) =>
      request<ProgramExercise>(`/api/program-exercises/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    remove: (id: number) =>
      request<void>(`/api/program-exercises/${id}/`, { method: "DELETE" }),
  },
  sessions: {
    list: (params: { date?: string; program?: number } = {}) =>
      request<WorkoutSession[]>(`/api/sessions/${buildQuery(params)}`),
    get: (id: number) => request<WorkoutSession>(`/api/sessions/${id}/`),
    create: (data: { program: number; notes?: string }) =>
      request<WorkoutSession>("/api/sessions/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<WorkoutSession>) =>
      request<WorkoutSession>(`/api/sessions/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    remove: (id: number) =>
      request<void>(`/api/sessions/${id}/`, { method: "DELETE" }),
    complete: (id: number) =>
      request<WorkoutSession>(`/api/sessions/${id}/complete/`, {
        method: "POST",
      }),
  },
  setEntries: {
    update: (id: number, data: Partial<SetEntry>) =>
      request<SetEntry>(`/api/set-entries/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    create: (data: Partial<SetEntry>) =>
      request<SetEntry>("/api/set-entries/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    remove: (id: number) =>
      request<void>(`/api/set-entries/${id}/`, { method: "DELETE" }),
  },
};
