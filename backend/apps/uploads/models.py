import os
import uuid

from django.conf import settings
from django.db import models


def portfolio_image_path(instance, filename):
    ext = os.path.splitext(filename)[1].lower()
    return f"portfolio_images/{instance.portfolio_id}/{uuid.uuid4().hex}{ext}"


class PortfolioImage(models.Model):
    portfolio = models.ForeignKey(
        "portfolios.PortfolioProject",
        on_delete=models.CASCADE,
        related_name="images",
    )
    page_data = models.ForeignKey(
        "portfolios.PortfolioPageData",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="images",
    )
    field_id = models.CharField(max_length=100)
    image = models.ImageField(upload_to=portfolio_image_path)
    original_filename = models.CharField(max_length=255, blank=True)
    file_size = models.PositiveIntegerField(default=0)
    width = models.PositiveIntegerField(default=0)
    height = models.PositiveIntegerField(default=0)
    sort_order = models.PositiveSmallIntegerField(default=0)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="uploaded_images",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sort_order", "created_at"]

    @property
    def page_id(self):
        return self.page_data.page_id if self.page_data else ""
