from rest_framework import serializers
from accounts.serializers import UserSerializer
from .models import Team, Student, Stage


class StageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stage
        fields = '__all__'


class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = '__all__'


class TeamListSerializer(serializers.ModelSerializer):
    project_manager_name = serializers.CharField(source='project_manager.name', read_only=True, default='')
    academic_admin_name = serializers.CharField(source='academic_admin.name', read_only=True, default='')
    lead_mentor_name = serializers.CharField(source='lead_mentor.name', read_only=True, default='')
    offline_lead_name = serializers.CharField(source='offline_lead.name', read_only=True, default='')
    current_stage_name = serializers.CharField(source='current_stage.name', read_only=True, default='')
    member_count = serializers.SerializerMethodField()
    next_deadline = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = [
            'id', 'team_name', 'project_name_cn', 'project_name_en', 'track',
            'season', 'current_stage', 'current_stage_name', 'risk_status',
            'project_manager', 'project_manager_name', 'academic_admin',
            'academic_admin_name', 'lead_mentor', 'lead_mentor_name',
            'offline_lead', 'offline_lead_name',
            'member_count', 'deliverable_completion_rate', 'mentor_score',
            'website_status', 'rnd_approved', 'crm_number',
            'offline_start', 'offline_end', 'offline_city', 'classroom',
            'project_proposal', 'budget_doc', 'okr_link', 'team_chat_group',
            'task_tracking_doc', 'project_log_doc',
            'stage1_progress', 'stage2_progress', 'stage3_progress',
            'ceo_status', 'cpo_status', 'cto_status', 'cmo_status', 'cfo_status',
            'next_deadline', 'updated_at',
        ]

    def get_member_count(self, obj):
        return obj.members.count()

    def get_next_deadline(self, obj):
        from deliverables.models import Deliverable
        d = Deliverable.objects.filter(
            team=obj, status__in=['not_started', 'in_progress']
        ).order_by('due_date').first()
        return d.due_date if d else None


class TeamDetailSerializer(serializers.ModelSerializer):
    project_manager = UserSerializer(read_only=True)
    academic_admin = UserSerializer(read_only=True)
    lead_mentor = UserSerializer(read_only=True)
    offline_lead = UserSerializer(read_only=True)
    current_stage = StageSerializer(read_only=True)
    members = StudentSerializer(many=True, read_only=True)

    class Meta:
        model = Team
        fields = '__all__'


class TeamCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = [
            'team_name', 'project_name_cn', 'project_name_en', 'track', 'season',
            'current_stage', 'risk_status', 'project_manager', 'academic_admin',
            'lead_mentor', 'description',
            'stage1_progress', 'stage2_progress', 'stage3_progress',
            'deliverable_completion_rate', 'mentor_score',
        ]
