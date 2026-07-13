from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class DailyLog(models.Model):
    team = models.ForeignKey("teams.Team", on_delete=models.CASCADE, related_name="daily_logs")
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="daily_logs",
        limit_choices_to={"role": "student"},
    )
    day = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    work_content = models.TextField(blank=True)
    task_completion = models.TextField(blank=True)
    problems_solutions = models.TextField(blank=True)
    reflection = models.TextField(blank=True)
    teacher_comment = models.TextField(blank=True)
    teacher_comment_updated_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("team", "student", "day")
        ordering = ["day"]

    def __str__(self):
        return f"{self.student.username} Day {self.day}"

    @property
    def is_complete(self):
        return all([
            (self.work_content or "").strip(),
            (self.task_completion or "").strip(),
            (self.problems_solutions or "").strip(),
            (self.reflection or "").strip(),
        ])

    @property
    def has_teacher_comment(self):
        return bool((self.teacher_comment or "").strip())
