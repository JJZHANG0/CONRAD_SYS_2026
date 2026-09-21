from rest_framework import generics, filters
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import timedelta
from .models import LessonRecord, CalendarEvent
from .serializers import LessonRecordSerializer, CalendarEventSerializer


class LessonRecordListCreateView(generics.ListCreateAPIView):
    queryset = LessonRecord.objects.select_related('team', 'mentor', 'academic_admin', 'stage')
    serializer_class = LessonRecordSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['team', 'mentor', 'academic_admin', 'stage']
    ordering = ['-lesson_time']


class LessonRecordDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = LessonRecord.objects.select_related('team', 'mentor', 'academic_admin', 'stage')
    serializer_class = LessonRecordSerializer


class PendingFeedbackView(generics.ListAPIView):
    serializer_class = LessonRecordSerializer

    def get_queryset(self):
        return LessonRecord.objects.filter(
            mentor_feedback_status='pending'
        ).select_related('team', 'mentor')


class CalendarEventListCreateView(generics.ListCreateAPIView):
    queryset = CalendarEvent.objects.select_related('team', 'mentor', 'academic_admin', 'stage')
    serializer_class = CalendarEventSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['team', 'mentor', 'academic_admin', 'stage']
    ordering = ['start_time']


class CalendarEventDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CalendarEvent.objects.select_related('team', 'mentor', 'academic_admin', 'stage')
    serializer_class = CalendarEventSerializer


class ThisWeekLessonsView(generics.ListAPIView):
    serializer_class = CalendarEventSerializer

    def get_queryset(self):
        now = timezone.now()
        week_end = now + timedelta(days=7)
        return CalendarEvent.objects.filter(
            start_time__gte=now, start_time__lte=week_end, is_cancelled=False
        ).select_related('team', 'mentor')
