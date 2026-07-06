from django.db import migrations, models
import django.db.models.deletion


def migrate_routines_into_programs(apps, schema_editor):
    Program = apps.get_model("workouts", "Program")
    Routine = apps.get_model("workouts", "Routine")
    RoutineExercise = apps.get_model("workouts", "RoutineExercise")
    ProgramExercise = apps.get_model("workouts", "ProgramExercise")
    WorkoutSession = apps.get_model("workouts", "WorkoutSession")

    for program in Program.objects.all():
        routines = list(program.routines.order_by("order", "id"))
        if not routines:
            continue

        # The first routine's schedule and exercises move onto the program
        # itself, since the program row (and its id) already exists and is
        # referenced by any existing sessions/foreign keys.
        first, rest = routines[0], routines[1:]
        program.recurrence_type = first.recurrence_type
        program.weekdays = first.weekdays
        program.interval_days = first.interval_days
        program.anchor_date = first.anchor_date
        program.save(
            update_fields=[
                "recurrence_type",
                "weekdays",
                "interval_days",
                "anchor_date",
            ]
        )
        for routine_exercise in RoutineExercise.objects.filter(routine=first):
            ProgramExercise.objects.create(
                program=program,
                exercise_id=routine_exercise.exercise_id,
                order=routine_exercise.order,
                target_sets=routine_exercise.target_sets,
                target_reps_min=routine_exercise.target_reps_min,
                target_reps_max=routine_exercise.target_reps_max,
                target_weight_kg=routine_exercise.target_weight_kg,
                rest_seconds=routine_exercise.rest_seconds,
                notes=routine_exercise.notes,
            )
        WorkoutSession.objects.filter(routine=first).update(program=program)

        # Any additional routines under the same program become their own
        # standalone (independently active/scheduled) programs.
        for routine in rest:
            new_program = Program.objects.create(
                name=f"{program.name} - {routine.name}",
                description=program.description,
                is_active=program.is_active,
                recurrence_type=routine.recurrence_type,
                weekdays=routine.weekdays,
                interval_days=routine.interval_days,
                anchor_date=routine.anchor_date,
            )
            for routine_exercise in RoutineExercise.objects.filter(routine=routine):
                ProgramExercise.objects.create(
                    program=new_program,
                    exercise_id=routine_exercise.exercise_id,
                    order=routine_exercise.order,
                    target_sets=routine_exercise.target_sets,
                    target_reps_min=routine_exercise.target_reps_min,
                    target_reps_max=routine_exercise.target_reps_max,
                    target_weight_kg=routine_exercise.target_weight_kg,
                    rest_seconds=routine_exercise.rest_seconds,
                    notes=routine_exercise.notes,
                )
            WorkoutSession.objects.filter(routine=routine).update(program=new_program)


class Migration(migrations.Migration):
    dependencies = [
        ("workouts", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="program",
            name="recurrence_type",
            field=models.CharField(
                choices=[
                    ("weekly", "Specific days of the week"),
                    ("interval", "Every N days"),
                ],
                default="weekly",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="program",
            name="weekdays",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="program",
            name="interval_days",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="program",
            name="anchor_date",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.CreateModel(
            name="ProgramExercise",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("order", models.PositiveIntegerField(default=0)),
                ("target_sets", models.PositiveIntegerField(default=3)),
                ("target_reps_min", models.PositiveIntegerField(default=8)),
                (
                    "target_reps_max",
                    models.PositiveIntegerField(blank=True, null=True),
                ),
                (
                    "target_weight_kg",
                    models.DecimalField(
                        blank=True, decimal_places=2, max_digits=6, null=True
                    ),
                ),
                ("rest_seconds", models.PositiveIntegerField(blank=True, null=True)),
                ("notes", models.TextField(blank=True)),
                (
                    "exercise",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="program_exercises",
                        to="workouts.exercise",
                    ),
                ),
                (
                    "program",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="exercises",
                        to="workouts.program",
                    ),
                ),
            ],
            options={
                "verbose_name": "program exercise",
                "verbose_name_plural": "program exercises",
                "db_table": "program_exercises",
                "ordering": ["program", "order", "id"],
            },
        ),
        migrations.RunPython(
            migrate_routines_into_programs, migrations.RunPython.noop
        ),
        migrations.RemoveField(
            model_name="workoutsession",
            name="routine",
        ),
        migrations.RemoveField(
            model_name="routineexercise",
            name="exercise",
        ),
        migrations.RemoveField(
            model_name="routineexercise",
            name="routine",
        ),
        migrations.RemoveField(
            model_name="routine",
            name="program",
        ),
        migrations.DeleteModel(
            name="RoutineExercise",
        ),
        migrations.DeleteModel(
            name="Routine",
        ),
    ]
