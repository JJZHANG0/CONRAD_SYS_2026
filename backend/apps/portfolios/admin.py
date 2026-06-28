from django.contrib import admin
from django.contrib.auth import get_user_model

from apps.portfolios.models import PortfolioPageData, PortfolioProject, TeacherStudentRelation
from apps.reviews.models import PageReview
from apps.uploads.models import PortfolioImage

User = get_user_model()


@admin.register(PortfolioProject)
class PortfolioProjectAdmin(admin.ModelAdmin):
    list_display = ("project_name", "owner", "assigned_teacher", "status", "completion_rate", "updated_at")
    list_filter = ("status", "challenge_category")
    search_fields = ("project_name", "owner__username", "title")


@admin.register(PortfolioPageData)
class PortfolioPageDataAdmin(admin.ModelAdmin):
    list_display = ("portfolio", "page_id", "status", "updated_at")
    list_filter = ("status", "page_id")


@admin.register(PortfolioImage)
class PortfolioImageAdmin(admin.ModelAdmin):
    list_display = ("portfolio", "field_id", "original_filename", "created_at")


@admin.register(PageReview)
class PageReviewAdmin(admin.ModelAdmin):
    list_display = ("portfolio", "page_data", "reviewer", "status", "updated_at")
    list_filter = ("status",)


@admin.register(TeacherStudentRelation)
class TeacherStudentRelationAdmin(admin.ModelAdmin):
    list_display = ("teacher", "student", "created_at")
