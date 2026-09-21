from django.contrib import admin
from .models import TemplateResource


@admin.register(TemplateResource)
class TemplateResourceAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'stage', 'updated_at']
    list_filter = ['category', 'stage']
