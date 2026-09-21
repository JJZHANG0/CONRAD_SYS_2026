from django.db import models
from django.conf import settings


class LessonRecord(models.Model):
    class FeedbackStatus(models.TextChoices):
        PENDING = 'pending', '待提交'
        SUBMITTED = 'submitted', '已提交'
        OVERDUE = 'overdue', '已逾期'

    team = models.ForeignKey('teams.Team', on_delete=models.CASCADE, related_name='lessons')
    mentor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name='mentor_lessons', verbose_name='授课导师'
    )
    academic_admin = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='admin_lessons', verbose_name='教务老师'
    )
    lesson_time = models.DateTimeField('上课时间')
    duration = models.IntegerField('时长(分钟)', default=90)
    topic = models.CharField('课程主题', max_length=300)
    stage = models.ForeignKey('teams.Stage', on_delete=models.SET_NULL, null=True, blank=True)
    lesson_goal = models.TextField('本节课目标', blank=True)
    completed_content = models.TextField('实际完成内容', blank=True)
    student_attendance = models.CharField('学生出勤', max_length=200, blank=True)
    student_performance = models.TextField('学生课堂表现', blank=True)
    project_progress = models.TextField('项目推进情况', blank=True)
    homework = models.TextField('课后任务', blank=True)
    next_lesson_plan = models.TextField('下节课计划', blank=True)
    risk_notes = models.TextField('当前风险', blank=True)
    admin_score = models.FloatField('教务评分', null=True, blank=True)
    mentor_feedback = models.TextField('导师课后反馈', blank=True)
    mentor_feedback_status = models.CharField(
        '反馈状态', max_length=20,
        choices=FeedbackStatus.choices, default=FeedbackStatus.PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-lesson_time']
        verbose_name = '课堂记录'
        verbose_name_plural = '课堂记录'

    def __str__(self):
        return f'{self.team.team_name} - {self.topic}'


class CalendarEvent(models.Model):
    team = models.ForeignKey('teams.Team', on_delete=models.CASCADE, related_name='calendar_events')
    mentor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name='calendar_events', verbose_name='授课导师'
    )
    academic_admin = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='admin_calendar_events', verbose_name='教务老师'
    )
    start_time = models.DateTimeField('开始时间')
    end_time = models.DateTimeField('结束时间')
    topic = models.CharField('课程主题', max_length=300)
    stage = models.ForeignKey('teams.Stage', on_delete=models.SET_NULL, null=True, blank=True)
    feedback_submitted = models.BooleanField('已提交反馈', default=False)
    is_cancelled = models.BooleanField('已取消', default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['start_time']
        verbose_name = '课程安排'
        verbose_name_plural = '课程安排'

    def __str__(self):
        return f'{self.team.team_name} - {self.topic}'
