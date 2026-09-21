from rest_framework import serializers
from .models import RiskLog, ActivityLog


class RiskLogSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(source='team.team_name', read_only=True)
    owner_name = serializers.CharField(source='owner.name', read_only=True, default='')
    created_by_name = serializers.CharField(source='created_by.name', read_only=True, default='')

    class Meta:
        model = RiskLog
        fields = '__all__'


class ActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True, default='')
    team_name = serializers.CharField(source='team.team_name', read_only=True, default='')

    class Meta:
        model = ActivityLog
        fields = '__all__'
