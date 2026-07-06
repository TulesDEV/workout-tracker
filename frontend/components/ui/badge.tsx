import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import type { ExerciseCategory } from "@/lib/types";

const categoryStyles: Record<ExerciseCategory, string> = {
  push: "bg-cat-push",
  pull: "bg-cat-pull",
  legs: "bg-cat-legs",
  core: "bg-cat-core",
  cardio: "bg-cat-cardio",
  full_body: "bg-cat-full-body",
  mobility: "bg-cat-mobility",
};

export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium text-foreground/80",
        className
      )}
      {...props}
    />
  );
}

export function CategoryBadge({ category }: { category: ExerciseCategory }) {
  return (
    <Badge className={categoryStyles[category]}>
      {category.replace("_", " ")}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: "in_progress" | "completed" }) {
  return (
    <Badge
      className={
        status === "completed"
          ? "bg-success text-success-foreground"
          : "bg-warning text-warning-foreground"
      }
    >
      {status === "completed" ? "Completed" : "In progress"}
    </Badge>
  );
}
