import pytest
from rest_framework.test import APIClient

from workouts.models import Exercise, Program, ProgramExercise, WorkoutSession

pytestmark = pytest.mark.django_db


@pytest.fixture
def client():
    return APIClient()


def test_multiple_programs_can_be_active_simultaneously():
    first = Program.objects.create(name="Push Day", is_active=True)
    second = Program.objects.create(name="Pull Day", is_active=True)

    first.refresh_from_db()
    second.refresh_from_db()

    assert first.is_active is True
    assert second.is_active is True


def test_activate_endpoint_does_not_deactivate_other_programs(client):
    first = Program.objects.create(name="Push Day", is_active=True)
    second = Program.objects.create(name="Pull Day")

    response = client.post(f"/api/programs/{second.pk}/activate/")

    assert response.status_code == 200
    first.refresh_from_db()
    second.refresh_from_db()
    assert first.is_active is True
    assert second.is_active is True


def test_deactivate_endpoint_deactivates_only_that_program(client):
    first = Program.objects.create(name="Push Day", is_active=True)
    second = Program.objects.create(name="Pull Day", is_active=True)

    response = client.post(f"/api/programs/{first.pk}/deactivate/")

    assert response.status_code == 200
    first.refresh_from_db()
    second.refresh_from_db()
    assert first.is_active is False
    assert second.is_active is True


def test_is_active_filter_on_program_list(client):
    Program.objects.create(name="Push Day", is_active=True)
    Program.objects.create(name="Rest Program", is_active=False)

    response = client.get("/api/programs/?is_active=true")

    assert response.status_code == 200
    assert [p["name"] for p in response.data] == ["Push Day"]


def test_creating_session_auto_populates_set_entries_from_program(client):
    program = Program.objects.create(name="Push Day", is_active=True)
    exercise = Exercise.objects.create(name="Bench Press")
    ProgramExercise.objects.create(
        program=program, exercise=exercise, target_sets=3, order=0
    )

    response = client.post("/api/sessions/", {"program": program.pk})

    assert response.status_code == 201
    session = WorkoutSession.objects.get(pk=response.data["id"])
    assert session.set_entries.count() == 3
    assert list(session.set_entries.values_list("set_number", flat=True)) == [1, 2, 3]


def test_complete_endpoint_marks_session_completed(client):
    program = Program.objects.create(name="Push Day", is_active=True)
    session = WorkoutSession.objects.create(program=program)

    response = client.post(f"/api/sessions/{session.pk}/complete/")

    assert response.status_code == 200
    session.refresh_from_db()
    assert session.status == WorkoutSession.Status.COMPLETED
    assert session.completed_at is not None
