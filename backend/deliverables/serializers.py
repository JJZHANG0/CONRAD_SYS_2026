from rest_framework import serializers
from .models import Deliverable


class DeliverableSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(source='team.team_name', read_only=True)
    stage_name = serializers.CharField(source='stage.name', read_only=True, default='')
    owner_name = serializers.CharField(source='owner.name', read_only=True, default='')
    reviewer_name = serializers.CharField(source='reviewer.name', read_only=True, default='')

    class Meta:
        model = Deliverable
        fields = '__all__'


class DeliverableReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Deliverable
        fields = ['status', 'score', 'review_comment']
