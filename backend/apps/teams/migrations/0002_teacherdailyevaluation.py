import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("teams", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="TeacherDailyEvaluation",
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
                (
                    "day",
                    models.PositiveSmallIntegerField(
                        validators=[
                            django.core.validators.MinValueValidator(1),
                            django.core.validators.MaxValueValidator(5),
                        ]
                    ),
                ),
                ("business_duration", models.BooleanField(default=False)),
                ("business_correction", models.BooleanField(default=False)),
                ("business_progress", models.BooleanField(default=False)),
                ("business_questions", models.BooleanField(default=False)),
                ("business_log_feedback", models.BooleanField(default=False)),
                ("engineering_duration", models.BooleanField(default=False)),
                ("engineering_development", models.BooleanField(default=False)),
                ("engineering_review", models.BooleanField(default=False)),
                ("engineering_progress", models.BooleanField(default=False)),
                ("engineering_log_feedback", models.BooleanField(default=False)),
                ("comment", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "reviewed_by",
                    models.ForeignKey(
                        blank=True,
                        limit_choices_to={"role": "operations"},
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="teacher_evaluations_given",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "team",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="teacher_evaluations",
                        to="teams.team",
                    ),
                ),
            ],
            options={"ordering": ["day"]},
        ),
        migrations.AddConstraint(
            model_name="teacherdailyevaluation",
            constraint=models.UniqueConstraint(
                fields=("team", "day"),
                name="unique_teacher_evaluation_per_team_day",
            ),
        ),
    ]
