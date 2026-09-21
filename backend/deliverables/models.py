from django.db import models
from django.conf import settings


class Deliverable(models.Model):
    class Status(models.TextChoices):
        NOT_STARTED = 'not_started', '未开始'
        IN_PROGRESS = 'in_progress', '进行中'
        SUBMITTED = 'submitted', '已提交'
        NEEDS_REVISION = 'needs_revision', '需修改'
        APPROVED = 'approved', '已通过'
        OVERDUE = 'overdue', '已逾期'

    class Type(models.TextChoices):
        FILE = 'file', '文件'
        LINK = 'link', '链接'
        FIGMA = 'figma', 'Figma'
        VIDEO = 'video', '视频'
        DOCUMENT = 'document', '文档'

    team = models.ForeignKey('teams.Team', on_delete=models.CASCADE, related_name='deliverables')
    stage = models.ForeignKey('teams.Stage', on_delete=models.SET_NULL, null=True, related_name='deliverables')
    title = models.CharField('标题', max_length=300)
    type = models.CharField('类型', max_length=20, choices=Type.choices, default=Type.FILE)
    status = models.CharField('状态', max_length=20, choices=Status.choices, default=Status.NOT_STARTED)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='owned_deliverables', verbose_name='负责人'
    )
    due_date = models.DateField('截止日期', null=True, blank=True)
    submitted_at = models.DateTimeField('提交时间', null=True, blank=True)
    file_url = models.URLField('文件链接', blank=True)
    external_link = models.URLField('外部链接', blank=True)
    score = models.FloatField('评分', null=True, blank=True)
    max_score = models.FloatField('满分', default=10)
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='reviewed_deliverables', verbose_name='审核人'
    )
    review_comment = models.TextField('审核意见', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['stage__order', 'due_date']
        verbose_name = '交付物'
        verbose_name_plural = '交付物'

    def __str__(self):
        return f'{self.team.team_name} - {self.title}'
