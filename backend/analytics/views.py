from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg, Count, Q
from django.utils import timezone
from datetime import timedelta
from teams.models import Team
from deliverables.models import Deliverable
from lessons.models import LessonRecord, CalendarEvent
from evaluations.models import TeacherEvaluation


class DashboardOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        teams = Team.objects.all()
        total = teams.count()
        normal = teams.filter(risk_status='normal').count()
        attention = teams.filter(risk_status='attention').count()
        critical = teams.filter(risk_status='critical').count()

        now = timezone.now()
        week_end = now + timedelta(days=7)
        week_deliverables = Deliverable.objects.filter(
            due_date__gte=now.date(), due_date__lte=week_end.date(),
            status__in=['not_started', 'in_progress']
        ).count()
        week_lessons = CalendarEvent.objects.filter(
            start_time__gte=now, start_time__lte=week_end, is_cancelled=False
        ).count()

        avg_mentor = TeacherEvaluation.objects.aggregate(avg=Avg('total_score'))['avg'] or 0
        avg_lesson = LessonRecord.objects.aggregate(avg=Avg('admin_score'))['avg'] or 0

        deliverable_stats = Deliverable.objects.aggregate(
            total=Count('id'),
            approved=Count('id', filter=Q(status='approved')),
            overdue=Count('id', filter=Q(status='overdue')),
        )
        completion_rate = 0
        if deliverable_stats['total']:
            completion_rate = round(deliverable_stats['approved'] / deliverable_stats['total'] * 100, 1)

        health_score = round(
            (normal / max(total, 1) * 40) +
            (completion_rate / 100 * 30) +
            (avg_mentor / 100 * 20) +
            (avg_lesson / 10 * 10), 1
        )

        return Response({
            'season': '2026-2027 Conrad Challenge',
            'total_teams': total,
            'normal_teams': normal,
            'attention_teams': attention,
            'critical_teams': critical,
            'week_deliverables': week_deliverables,
            'week_lessons': week_lessons,
            'avg_mentor_score': round(avg_mentor, 1),
            'avg_lesson_score': round(avg_lesson, 1),
            'health_score': health_score,
            'deliverable_completion_rate': completion_rate,
            'overdue_deliverables': deliverable_stats['overdue'],
            'risk_distribution': {
                'normal': normal,
                'attention': attention,
                'critical': critical,
            },
        })


class StageCompletionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from teams.models import Stage
        stages = Stage.objects.all()
        result = []
        for stage in stages:
            deliverables = Deliverable.objects.filter(stage=stage)
            total = deliverables.count()
            approved = deliverables.filter(status='approved').count()
            result.append({
                'stage_id': stage.id,
                'stage_name': stage.name,
                'total': total,
                'approved': approved,
                'completion_rate': round(approved / max(total, 1) * 100, 1),
                'team_count': Team.objects.filter(current_stage=stage).count(),
            })
        return Response(result)


class AnalyticsDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        teams = Team.objects.all()
        total = teams.count()
        deliverables = Deliverable.objects.all()
        d_total = deliverables.count()
        d_approved = deliverables.filter(status='approved').count()

        return Response({
            'total_teams': total,
            'stage_distribution': list(
                teams.values('current_stage__name').annotate(count=Count('id'))
            ),
            'deliverable_completion_rate': round(d_approved / max(d_total, 1) * 100, 1),
            'avg_mentor_score': round(
                TeacherEvaluation.objects.aggregate(avg=Avg('total_score'))['avg'] or 0, 1
            ),
            'avg_lesson_score': round(
                LessonRecord.objects.aggregate(avg=Avg('admin_score'))['avg'] or 0, 1
            ),
            'risk_distribution': {
                'normal': teams.filter(risk_status='normal').count(),
                'attention': teams.filter(risk_status='attention').count(),
                'critical': teams.filter(risk_status='critical').count(),
            },
            'overdue_deliverables': deliverables.filter(status='overdue').count(),
            'video_completed': deliverables.filter(title__icontains='视频', status='approved').count(),
            'website_completed': deliverables.filter(title__icontains='网站', status='approved').count(),
        })
