from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Exercise, Program, ProgramExercise, SetEntry, WorkoutSession
from .serializers import (
    ExerciseSerializer,
    ProgramExerciseSerializer,
    ProgramSerializer,
    SetEntrySerializer,
    WorkoutSessionSerializer,
)


class ExerciseViewSet(viewsets.ModelViewSet):
    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer


class ProgramViewSet(viewsets.ModelViewSet):
    queryset = Program.objects.all().prefetch_related("exercises__exercise")
    serializer_class = ProgramSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")
        return queryset

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        program = self.get_object()
        program.is_active = True
        program.save(update_fields=["is_active"])
        return Response(self.get_serializer(program).data)

    @action(detail=True, methods=["post"])
    def deactivate(self, request, pk=None):
        program = self.get_object()
        program.is_active = False
        program.save(update_fields=["is_active"])
        return Response(self.get_serializer(program).data)


class ProgramExerciseViewSet(viewsets.ModelViewSet):
    queryset = ProgramExercise.objects.select_related("exercise", "program")
    serializer_class = ProgramExerciseSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        program_id = self.request.query_params.get("program")
        if program_id:
            queryset = queryset.filter(program_id=program_id)
        return queryset


class WorkoutSessionViewSet(viewsets.ModelViewSet):
    queryset = WorkoutSession.objects.select_related("program").prefetch_related(
        "set_entries__exercise"
    )
    serializer_class = WorkoutSessionSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        params = self.request.query_params
        date_param = params.get("date")
        program_id = params.get("program")
        if date_param:
            queryset = queryset.filter(date=date_param)
        if program_id:
            queryset = queryset.filter(program_id=program_id)
        return queryset

    def perform_create(self, serializer):
        session = serializer.save()
        entries = []
        program_exercises = session.program.exercises.select_related(
            "exercise"
        ).order_by("order")
        for program_exercise in program_exercises:
            for set_number in range(1, program_exercise.target_sets + 1):
                entries.append(
                    SetEntry(
                        session=session,
                        exercise=program_exercise.exercise,
                        order=program_exercise.order,
                        set_number=set_number,
                    )
                )
        SetEntry.objects.bulk_create(entries)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        session = self.get_object()
        session.status = WorkoutSession.Status.COMPLETED
        session.completed_at = timezone.now()
        session.save(update_fields=["status", "completed_at"])
        return Response(self.get_serializer(session).data)


class SetEntryViewSet(viewsets.ModelViewSet):
    queryset = SetEntry.objects.select_related("exercise", "session")
    serializer_class = SetEntrySerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        session_id = self.request.query_params.get("session")
        if session_id:
            queryset = queryset.filter(session_id=session_id)
        return queryset
