from django.conf import settings
from django.db import models


class PageReview(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        NEED_REVISION = "need_revision", "Need Revision"
        APPROVED = "approved", "Approved"

    portfolio = models.ForeignKey(
        "portfolios.PortfolioProject",
        on_delete=models.CASCADE,
        related_name="page_reviews",
    )
    page_data = models.ForeignKey(
        "portfolios.PortfolioPageData",
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="reviews_given",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    overall_comment = models.TextField(blank=True)
    content_suggestion = models.TextField(blank=True)
    application_suggestion = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("portfolio", "page_data")
        ordering = ["page_data__page_number"]

    @property
    def page_id(self):
        return self.page_data.page_id
