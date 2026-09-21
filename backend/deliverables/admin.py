from django.contrib import admin
from .models import Deliverable


@admin.register(Deliverable)
class DeliverableAdmin(admin.ModelAdmin):
    list_display = ['title', 'team', 'status', 'due_date', 'score']
    list_filter = ['status', 'stage']
