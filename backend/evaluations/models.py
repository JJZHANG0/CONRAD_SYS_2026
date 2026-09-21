from django.db import models
from django.conf import settings


def calculate_teacher_level(score):
    if score >= 90:
        return 'S'
    if score >= 80:
        return 'A'
    if score >= 70:
        return 'B'
    if score >= 60:
        return 'C'
    return 'D'


class TeacherEvaluation(models.Model):
    mentor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='teacher_evaluations', verbose_name='导师'
    )
    team = models.ForeignKey('teams.Team', on_delete=models.CASCADE, related_name='teacher_evaluations')
    season = models.CharField('赛季', max_length=50, default='2026-2027')
    score_a = models.FloatField('阶段交付物完成度', default=0)
    score_b = models.FloatField('课堂质量与项目推进', default=0)
    score_c = models.FloatField('课前备课与课后反馈', default=0)
    score_d = models.FloatField('团队管理与沟通配合', default=0)
    score_e = models.FloatField('最终成果与竞赛表现', default=0)
    total_score = models.FloatField('总分', default=0)
    level = models.CharField('等级', max_length=2, blank=True)
    comments = models.TextField('评语', blank=True)
    evaluated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name='evaluations_given', verbose_name='评分人'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-total_score']
        verbose_name = '导师评分'
        verbose_name_plural = '导师评分'

    def save(self, *args, **kwargs):
        self.total_score = self.score_a + self.score_b + self.score_c + self.score_d + self.score_e
        self.level = calculate_teacher_level(self.total_score)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.mentor.name} - {self.team.team_name}'


class TeamScore(models.Model):
    team = models.ForeignKey('teams.Team', on_delete=models.CASCADE, related_name='team_scores')
    project_clarity = models.FloatField('项目方向清晰度', default=0)
    technical_feasibility = models.FloatField('技术方案可行性', default=0)
    business_model = models.FloatField('商业模式完整度', default=0)
    market_research = models.FloatField('市场调研质量', default=0)
    prototype_quality = models.FloatField('产品原型完成度', default=0)
    pitch_deck_quality = models.FloatField('PPT表达质量', default=0)
    video_quality = models.FloatField('视频完成度', default=0)
    website_quality = models.FloatField('网站完成度', default=0)
    qa_preparation = models.FloatField('答辩准备度', default=0)
    teamwork = models.FloatField('团队协作度', default=0)
    execution = models.FloatField('学生执行力', default=0)
    final_competitiveness = models.FloatField('最终竞赛竞争力', default=0)
    total_score = models.FloatField('总分', default=0)
    strengths = models.TextField('队伍优势', blank=True)
    weaknesses = models.TextField('当前短板', blank=True)
    suggestions = models.TextField('提升建议', blank=True)
    comments = models.TextField('项目经理备注', blank=True)
    evaluated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name='team_scores_given', verbose_name='评分人'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-total_score']
        verbose_name = '队伍评分'
        verbose_name_plural = '队伍评分'

    def save(self, *args, **kwargs):
        fields = [
            'project_clarity', 'technical_feasibility', 'business_model',
            'market_research', 'prototype_quality', 'pitch_deck_quality',
            'video_quality', 'website_quality', 'qa_preparation', 'teamwork',
            'execution', 'final_competitiveness',
        ]
        self.total_score = sum(getattr(self, f) for f in fields)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.team.team_name} - {self.total_score}'
