from rest_framework import serializers
from .models import TeacherEvaluation, TeamScore


class TeacherEvaluationSerializer(serializers.ModelSerializer):
    mentor_name = serializers.CharField(source='mentor.name', read_only=True)
    team_name = serializers.CharField(source='team.team_name', read_only=True)
    evaluated_by_name = serializers.CharField(source='evaluated_by.name', read_only=True, default='')

    class Meta:
        model = TeacherEvaluation
        fields = '__all__'
        read_only_fields = ['total_score', 'level']


class TeamScoreSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(source='team.team_name', read_only=True)
    evaluated_by_name = serializers.CharField(source='evaluated_by.name', read_only=True, default='')

    class Meta:
        model = TeamScore
        fields = '__all__'
        read_only_fields = ['total_score']
