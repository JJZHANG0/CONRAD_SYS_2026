from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("username", "email", "role", "display_name", "school", "grade", "is_active")
    list_filter = ("role", "is_active", "school")
    search_fields = ("username", "email", "display_name")
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Profile", {"fields": ("role", "display_name", "phone", "school", "grade")}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ("Profile", {"fields": ("role", "display_name", "email", "phone", "school", "grade")}),
    )
