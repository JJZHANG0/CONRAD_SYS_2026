from rest_framework import serializers
from .models import TemplateResource


class TemplateResourceSerializer(serializers.ModelSerializer):
    stage_name = serializers.CharField(source='stage.name', read_only=True, default='')
    uploaded_by_name = serializers.CharField(source='uploaded_by.name', read_only=True, default='')

    class Meta:
        model = TemplateResource
        fields = '__all__'
