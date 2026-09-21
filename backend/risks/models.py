from django.db import models
from django.conf import settings


class RiskLog(models.Model):
    class RiskLevel(models.TextChoices):
        NORMAL = 'normal', '正常推进'
        ATTENTION = 'attention', '需要关注'
        CRITICAL = 'critical', '需要介入'

    class Status(models.TextChoices):
        OPEN = 'open', '待处理'
        IN_PROGRESS = 'in_progress', '处理中'
        RESOLVED = 'resolved', '已解决'

    team = models.ForeignKey('teams.Team', on_delete=models.CASCADE, related_name='risk_logs')
    risk_level = models.CharField('风险等级', max_length=20, choices=RiskLevel.choices)
    risk_type = models.CharField('风险类型', max_length=100, blank=True)
    description = models.TextField('风险描述')
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='owned_risks', verbose_name='责任人'
    )
    status = models.CharField('处理状态', max_length=20, choices=Status.choices, default=Status.OPEN)
    action_plan = models.TextField('处理计划', blank=True)
    next_action = models.CharField('下一步动作', max_length=300, blank=True)
    reminder_time = models.DateTimeField('提醒时间', null=True, blank=True)
    resolved_at = models.DateTimeField('解决时间', null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name='created_risks', verbose_name='创建人'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        verbose_name = '风险记录'
        verbose_name_plural = '风险记录'

    def __str__(self):
        return f'{self.team.team_name} - {self.risk_level}'


class ActivityLog(models.Model):
    team = models.ForeignKey('teams.Team', on_delete=models.SET_NULL, null=True, blank=True, related_name='activities')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action = models.CharField('动作', max_length=200)
    description = models.TextField('描述')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = '活动日志'
        verbose_name_plural = '活动日志'

    def __str__(self):
        return self.description
