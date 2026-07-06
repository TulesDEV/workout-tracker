from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline

from .models import Exercise, Program, ProgramExercise, SetEntry, WorkoutSession


class ProgramExerciseInline(TabularInline):
    model = ProgramExercise
    extra = 1


class SetEntryInline(TabularInline):
    model = SetEntry
    extra = 0


@admin.register(Exercise)
class ExerciseAdmin(ModelAdmin):
    list_display = ["name", "category", "equipment"]
    list_filter = ["category"]
    search_fields = ["name"]


@admin.register(Program)
class ProgramAdmin(ModelAdmin):
    list_display = ["name", "is_active", "recurrence_type", "created_at"]
    list_filter = ["is_active", "recurrence_type"]
    inlines = [ProgramExerciseInline]


@admin.register(WorkoutSession)
class WorkoutSessionAdmin(ModelAdmin):
    list_display = ["date", "program", "status"]
    list_filter = ["status", "program"]
    inlines = [SetEntryInline]
