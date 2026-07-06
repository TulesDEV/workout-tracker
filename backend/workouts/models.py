from datetime import date

from django.db import models
from django.utils.translation import gettext_lazy as _


class Exercise(models.Model):
    class Category(models.TextChoices):
        PUSH = "push", _("Push")
        PULL = "pull", _("Pull")
        LEGS = "legs", _("Legs")
        CORE = "core", _("Core")
        CARDIO = "cardio", _("Cardio")
        FULL_BODY = "full_body", _("Full Body")
        MOBILITY = "mobility", _("Mobility")

    name = models.CharField(max_length=200, unique=True)
    category = models.CharField(
        max_length=20, choices=Category.choices, default=Category.FULL_BODY
    )
    equipment = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)

    class Meta:
        db_table = "exercises"
        ordering = ["name"]
        verbose_name = _("exercise")
        verbose_name_plural = _("exercises")

    def __str__(self):
        return self.name


class Program(models.Model):
    class Recurrence(models.TextChoices):
        WEEKLY = "weekly", _("Specific days of the week")
        INTERVAL = "interval", _("Every N days")

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    # Multiple programs can be active at once, each running on its own
    # schedule (e.g. "Push Day" every Mon/Thu and "Cardio" every 3 days).
    is_active = models.BooleanField(default=False)
    recurrence_type = models.CharField(
        max_length=20, choices=Recurrence.choices, default=Recurrence.WEEKLY
    )
    # Days of week this program is due, for recurrence_type=WEEKLY.
    # 0 = Monday ... 6 = Sunday (matches date.weekday()).
    weekdays = models.JSONField(default=list, blank=True)
    # Repeat every N days starting from anchor_date, for recurrence_type=INTERVAL.
    interval_days = models.PositiveIntegerField(null=True, blank=True)
    anchor_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    modified_at = models.DateTimeField(_("modified at"), auto_now=True)

    class Meta:
        db_table = "programs"
        ordering = ["-is_active", "-created_at"]
        verbose_name = _("program")
        verbose_name_plural = _("programs")

    def __str__(self):
        return self.name

    def is_due_on(self, on_date: date) -> bool:
        if self.recurrence_type == self.Recurrence.WEEKLY:
            return on_date.weekday() in (self.weekdays or [])
        if self.recurrence_type == self.Recurrence.INTERVAL:
            if not self.interval_days or not self.anchor_date:
                return False
            delta = (on_date - self.anchor_date).days
            return delta >= 0 and delta % self.interval_days == 0
        return False


class ProgramExercise(models.Model):
    program = models.ForeignKey(
        Program, related_name="exercises", on_delete=models.CASCADE
    )
    exercise = models.ForeignKey(
        Exercise, related_name="program_exercises", on_delete=models.PROTECT
    )
    order = models.PositiveIntegerField(default=0)
    target_sets = models.PositiveIntegerField(default=3)
    target_reps_min = models.PositiveIntegerField(default=8)
    target_reps_max = models.PositiveIntegerField(null=True, blank=True)
    target_weight_kg = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True
    )
    rest_seconds = models.PositiveIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "program_exercises"
        ordering = ["program", "order", "id"]
        verbose_name = _("program exercise")
        verbose_name_plural = _("program exercises")

    def __str__(self):
        return f"{self.program.name} - {self.exercise.name}"


class WorkoutSession(models.Model):
    class Status(models.TextChoices):
        IN_PROGRESS = "in_progress", _("In progress")
        COMPLETED = "completed", _("Completed")

    program = models.ForeignKey(
        Program, related_name="sessions", on_delete=models.CASCADE
    )
    date = models.DateField(default=date.today)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.IN_PROGRESS
    )
    notes = models.TextField(blank=True)
    started_at = models.DateTimeField(_("started at"), auto_now_add=True)
    completed_at = models.DateTimeField(_("completed at"), null=True, blank=True)

    class Meta:
        db_table = "workout_sessions"
        ordering = ["-date", "-started_at"]
        verbose_name = _("workout session")
        verbose_name_plural = _("workout sessions")

    def __str__(self):
        return f"{self.program.name} - {self.date}"


class SetEntry(models.Model):
    session = models.ForeignKey(
        WorkoutSession, related_name="set_entries", on_delete=models.CASCADE
    )
    exercise = models.ForeignKey(
        Exercise,
        related_name="set_entries",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    order = models.PositiveIntegerField(default=0)
    set_number = models.PositiveIntegerField(default=1)
    reps = models.PositiveIntegerField(null=True, blank=True)
    weight_kg = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True
    )
    completed = models.BooleanField(default=False)

    class Meta:
        db_table = "set_entries"
        ordering = ["session", "order", "set_number"]
        verbose_name = _("set entry")
        verbose_name_plural = _("set entries")

    def __str__(self):
        exercise_name = self.exercise.name if self.exercise else "Unknown exercise"
        return f"{exercise_name} - set {self.set_number}"
