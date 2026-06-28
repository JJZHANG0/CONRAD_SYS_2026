from django.conf import settings
from django.db import models


class PortfolioProject(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        IN_PROGRESS = "in_progress", "In Progress"
        SUBMITTED = "submitted", "Submitted"
        UNDER_REVIEW = "under_review", "Under Review"
        NEED_REVISION = "need_revision", "Need Revision"
        APPROVED = "approved", "Approved"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="portfolios",
    )
    assigned_teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_portfolios",
    )
    title = models.CharField(max_length=200, default="My Portfolio")
    project_name = models.CharField(max_length=200, blank=True)
    challenge_category = models.CharField(max_length=200, blank=True)
    target_major = models.CharField(max_length=200, blank=True)
    mentor_name = models.CharField(max_length=200, blank=True)
    program_duration = models.CharField(max_length=100, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )
    completion_rate = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.project_name or self.title} ({self.owner.username})"


class PortfolioPageData(models.Model):
    class Status(models.TextChoices):
        NOT_STARTED = "not_started", "Not Started"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"

    portfolio = models.ForeignKey(
        PortfolioProject,
        on_delete=models.CASCADE,
        related_name="pages",
    )
    page_id = models.CharField(max_length=50)
    page_number = models.PositiveSmallIntegerField(default=0)
    part = models.CharField(max_length=100, blank=True)
    title_en = models.CharField(max_length=200, blank=True)
    title_zh = models.CharField(max_length=200, blank=True)
    fields = models.JSONField(default=dict, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.NOT_STARTED,
    )
    word_count_summary = models.JSONField(default=dict, blank=True)
    missing_required_fields = models.JSONField(default=list, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("portfolio", "page_id")
        ordering = ["page_number"]

    def __str__(self):
        return f"{self.portfolio_id} - {self.page_id}"


class TeacherStudentRelation(models.Model):
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="teacher_relations",
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="student_relations",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("teacher", "student")
