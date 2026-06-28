from django.conf import settings
from django.core.exceptions import ValidationError
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
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return self.name

    @property
    def member_count(self):
        return self.members.count()


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
        existing = TeamMember.objects.filter(student=self.student).exclude(pk=self.pk)
        if existing.exists():
            raise ValidationError("A student can only belong to one team.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
