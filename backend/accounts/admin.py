from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'name', 'email', 'role', 'status']
    list_filter = ['role', 'status']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('扩展信息', {'fields': ('name', 'phone', 'role', 'avatar', 'status')}),
    )
