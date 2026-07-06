export type ExerciseCategory =
  | "push"
  | "pull"
  | "legs"
  | "core"
  | "cardio"
  | "full_body"
  | "mobility";

export interface Exercise {
  id: number;
  name: string;
  category: ExerciseCategory;
  equipment: string;
  notes: string;
  created_at: string;
}

export type RecurrenceType = "weekly" | "interval";

export interface ProgramExercise {
  id: number;
  program: number;
  exercise: number;
  exercise_detail: Exercise;
  order: number;
  target_sets: number;
  target_reps_min: number;
  target_reps_max: number | null;
  target_weight_kg: string | null;
  rest_seconds: number | null;
  notes: string;
}

export interface Program {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  recurrence_type: RecurrenceType;
  weekdays: number[];
  interval_days: number | null;
  anchor_date: string | null;
  exercises: ProgramExercise[];
  created_at: string;
  modified_at: string;
}

export type SessionStatus = "in_progress" | "completed";

export interface SetEntry {
  id: number;
  session: number;
  exercise: number | null;
  exercise_detail: Exercise | null;
  order: number;
  set_number: number;
  reps: number | null;
  weight_kg: string | null;
  completed: boolean;
}

export interface WorkoutSession {
  id: number;
  program: number;
  program_name: string;
  date: string;
  status: SessionStatus;
  notes: string;
  started_at: string;
  completed_at: string | null;
  set_entries: SetEntry[];
}

export const EXERCISE_CATEGORIES: { value: ExerciseCategory; label: string }[] = [
  { value: "push", label: "Push" },
  { value: "pull", label: "Pull" },
  { value: "legs", label: "Legs" },
  { value: "core", label: "Core" },
  { value: "cardio", label: "Cardio" },
  { value: "full_body", label: "Full Body" },
  { value: "mobility", label: "Mobility" },
];

export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
