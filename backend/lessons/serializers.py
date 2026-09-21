from rest_framework import serializers
from .models import LessonRecord, CalendarEvent


class LessonRecordSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(source='team.team_name', read_only=True)
    mentor_name = serializers.CharField(source='mentor.name', read_only=True, default='')
    academic_admin_name = serializers.CharField(source='academic_admin.name', read_only=True, default='')
    stage_name = serializers.CharField(source='stage.name', read_only=True, default='')

    class Meta:
        model = LessonRecord
        fields = '__all__'


class CalendarEventSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(source='team.team_name', read_only=True)
    mentor_name = serializers.CharField(source='mentor.name', read_only=True, default='')
    academic_admin_name = serializers.CharField(source='academic_admin.name', read_only=True, default='')
    stage_name = serializers.CharField(source='stage.name', read_only=True, default='')

    class Meta:
        model = CalendarEvent
        fields = '__all__'
