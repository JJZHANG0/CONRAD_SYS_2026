from django.urls import path
from .views import (
    LessonRecordListCreateView, LessonRecordDetailView, PendingFeedbackView,
    CalendarEventListCreateView, CalendarEventDetailView, ThisWeekLessonsView,
)

urlpatterns = [
    path('', LessonRecordListCreateView.as_view(), name='lesson_list'),
    path('<int:pk>/', LessonRecordDetailView.as_view(), name='lesson_detail'),
    path('pending-feedback/', PendingFeedbackView.as_view(), name='pending_feedback'),
    path('calendar/', CalendarEventListCreateView.as_view(), name='calendar_list'),
    path('calendar/<int:pk>/', CalendarEventDetailView.as_view(), name='calendar_detail'),
    path('calendar/this-week/', ThisWeekLessonsView.as_view(), name='this_week_lessons'),
]
