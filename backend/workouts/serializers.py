from rest_framework import serializers

from .models import Exercise, Program, ProgramExercise, SetEntry, WorkoutSession


class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = ["id", "name", "category", "equipment", "notes", "created_at"]
        read_only_fields = ["id", "created_at"]


class ProgramExerciseSerializer(serializers.ModelSerializer):
    exercise_detail = ExerciseSerializer(source="exercise", read_only=True)

    class Meta:
        model = ProgramExercise
        fields = [
            "id",
            "program",
            "exercise",
            "exercise_detail",
            "order",
            "target_sets",
            "target_reps_min",
            "target_reps_max",
            "target_weight_kg",
            "rest_seconds",
            "notes",
        ]
        read_only_fields = ["id"]


class ProgramSerializer(serializers.ModelSerializer):
    exercises = ProgramExerciseSerializer(many=True, read_only=True)

    class Meta:
        model = Program
        fields = [
            "id",
            "name",
            "description",
            "is_active",
            "recurrence_type",
            "weekdays",
            "interval_days",
            "anchor_date",
            "exercises",
            "created_at",
            "modified_at",
        ]
        read_only_fields = ["id", "created_at", "modified_at"]


class SetEntrySerializer(serializers.ModelSerializer):
    exercise_detail = ExerciseSerializer(source="exercise", read_only=True)

    class Meta:
        model = SetEntry
        fields = [
            "id",
            "session",
            "exercise",
            "exercise_detail",
            "order",
            "set_number",
            "reps",
            "weight_kg",
            "completed",
        ]
        read_only_fields = ["id"]


class WorkoutSessionSerializer(serializers.ModelSerializer):
    set_entries = SetEntrySerializer(many=True, read_only=True)
    program_name = serializers.CharField(source="program.name", read_only=True)

    class Meta:
        model = WorkoutSession
        fields = [
            "id",
            "program",
            "program_name",
            "date",
            "status",
            "notes",
            "started_at",
            "completed_at",
            "set_entries",
        ]
        read_only_fields = ["id", "started_at", "completed_at"]
