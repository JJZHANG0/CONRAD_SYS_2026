from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Team(models.Model):
    name = models.CharField(max_length=200)
    project_name = models.CharField(max_length=200, blank=True)
    challenge_category = models.CharField(max_length=200, blank=True)
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="teams",
        limit_choices_to={"role": "teacher"},
    )
    # Optional additional teachers (teacher or operations) for dual-coach teams.
    co_teachers = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name="co_taught_teams",
    )
    description = models.TextField(blank=True)
    product_website_url = models.URLField(max_length=500, blank=True)
    product_video_url = models.URLField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return self.name

    @property
    def member_count(self):
        return self.members.count()

    def teacher_display_names(self):
        names = [self.teacher.display_name]
        for user in self.co_teachers.all():
            name = user.display_name or user.username
            if name and name not in names:
                names.append(name)
        return names

    def teacher_names_text(self):
        return " / ".join(self.teacher_display_names())


class TeamMember(models.Model):
    MAX_MEMBERS = 5

    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="members")
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="team_memberships",
        limit_choices_to={"role": "student"},
    )
    student_role = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("team", "student")

    def clean(self):
        if self.team_id and self.team.members.count() >= self.MAX_MEMBERS:
            if not self.pk:
                raise ValidationError("A team can have at most 5 students.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class TeacherDailyEvaluation(models.Model):
    """Operations' daily, fact-based evaluation of a team's assigned teacher."""

    CHECK_FIELDS = (
        "business_duration",
        "business_correction",
        "business_progress",
        "business_questions",
        "business_log_feedback",
        "engineering_duration",
        "engineering_development",
        "engineering_review",
        "engineering_progress",
        "engineering_log_feedback",
    )

    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        related_name="teacher_evaluations",
    )
    day = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="teacher_evaluations_given",
        limit_choices_to={"role": "operations"},
    )

    business_duration = models.BooleanField(default=False)
    business_correction = models.BooleanField(default=False)
    business_progress = models.BooleanField(default=False)
    business_questions = models.BooleanField(default=False)
    business_log_feedback = models.BooleanField(default=False)

    engineering_duration = models.BooleanField(default=False)
    engineering_development = models.BooleanField(default=False)
    engineering_review = models.BooleanField(default=False)
    engineering_progress = models.BooleanField(default=False)
    engineering_log_feedback = models.BooleanField(default=False)

    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["day"]
        constraints = [
            models.UniqueConstraint(
                fields=["team", "day"],
                name="unique_teacher_evaluation_per_team_day",
            )
        ]

    @property
    def business_score(self):
        return sum(
            bool(getattr(self, field))
            for field in self.CHECK_FIELDS
            if field.startswith("business_")
        )

    @property
    def engineering_score(self):
        return sum(
            bool(getattr(self, field))
            for field in self.CHECK_FIELDS
            if field.startswith("engineering_")
        )

    @property
    def total_score(self):
        return self.business_score + self.engineering_score

    def __str__(self):
        return f"{self.team.name} Day {self.day}: {self.total_score}/10"
