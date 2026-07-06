from datetime import date

import pytest

from workouts.models import Program

pytestmark = pytest.mark.django_db


def make_program(**kwargs):
    defaults = {"name": "Test Program"}
    defaults.update(kwargs)
    return Program.objects.create(**defaults)


def test_weekly_recurrence_matches_configured_weekdays():
    program = make_program(
        recurrence_type=Program.Recurrence.WEEKLY,
        weekdays=[0, 3],  # Monday, Thursday
    )
    monday = date(2026, 7, 6)
    tuesday = date(2026, 7, 7)
    thursday = date(2026, 7, 9)

    assert program.is_due_on(monday) is True
    assert program.is_due_on(tuesday) is False
    assert program.is_due_on(thursday) is True


def test_interval_recurrence_matches_every_n_days_from_anchor():
    anchor = date(2026, 7, 1)
    program = make_program(
        recurrence_type=Program.Recurrence.INTERVAL,
        interval_days=3,
        anchor_date=anchor,
    )

    assert program.is_due_on(anchor) is True
    assert program.is_due_on(date(2026, 7, 2)) is False
    assert program.is_due_on(date(2026, 7, 4)) is True
    assert program.is_due_on(date(2026, 6, 28)) is False


def test_interval_recurrence_without_config_is_never_due():
    program = make_program(recurrence_type=Program.Recurrence.INTERVAL)
    assert program.is_due_on(date(2026, 7, 6)) is False
