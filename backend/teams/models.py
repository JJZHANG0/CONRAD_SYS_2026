from django.db import models
from django.conf import settings


class Stage(models.Model):
    name = models.CharField('阶段名称', max_length=200)
    order = models.IntegerField('排序', default=0)
    description = models.TextField('描述', blank=True)
    start_date = models.DateField('开始日期', null=True, blank=True)
    end_date = models.DateField('结束日期', null=True, blank=True)

    class Meta:
        ordering = ['order']
        verbose_name = '阶段'
        verbose_name_plural = '阶段'

    def __str__(self):
        return self.name


class Team(models.Model):
    class Track(models.TextChoices):
        HEALTH = 'health', '营养健康'
        ENERGY = 'energy', '能源环境'
        CYBER = 'cyber', '网络安全'
        AEROSPACE = 'aerospace', '航空航天'
        WATER = 'water', '水可持续'
        SPECIAL = 'special', '特别赛道'

    class RiskStatus(models.TextChoices):
        NORMAL = 'normal', '正常推进'
        ATTENTION = 'attention', '需要关注'
        CRITICAL = 'critical', '需要介入'

    team_name = models.CharField('队伍名称', max_length=200)
    project_name_cn = models.CharField('项目中文名', max_length=300)
    project_name_en = models.CharField('项目英文名', max_length=300, blank=True)
    track = models.CharField('赛道', max_length=20, choices=Track.choices, default=Track.HEALTH)
    season = models.CharField('赛季', max_length=50, default='2026-2027')
    current_stage = models.ForeignKey(
        Stage, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='teams', verbose_name='当前阶段'
    )
    risk_status = models.CharField(
        '风险状态', max_length=20, choices=RiskStatus.choices, default=RiskStatus.NORMAL
    )
    project_manager = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='managed_teams', verbose_name='项目运营老师'
    )
    academic_admin = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='academic_teams', verbose_name='教务老师'
    )
    lead_mentor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='mentor_teams', verbose_name='带队教练'
    )
    offline_lead = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='offline_lead_teams', verbose_name='线下带队'
    )
    description = models.TextField('描述', blank=True)
    deliverable_completion_rate = models.FloatField('交付完成率', default=0)
    mentor_score = models.FloatField('导师评分', default=0)
    # 表格扩展字段
    website_status = models.CharField('产品网站完成', max_length=50, blank=True)
    rnd_approved = models.BooleanField('研发审批发放', default=False)
    crm_number = models.CharField('CRM申请编号', max_length=100, blank=True)
    offline_start = models.DateField('线下启动', null=True, blank=True)
    offline_end = models.DateField('线下结束', null=True, blank=True)
    offline_city = models.CharField('线下城市', max_length=100, blank=True)
    classroom = models.CharField('预定教室', max_length=200, blank=True)
    project_proposal = models.CharField('项目立项书', max_length=500, blank=True)
    budget_doc = models.CharField('项目预算', max_length=500, blank=True)
    okr_link = models.CharField('队伍OKR节点', max_length=500, blank=True)
    team_chat_group = models.CharField('队伍群聊', max_length=500, blank=True)
    task_tracking_doc = models.CharField('任务跟踪表', max_length=500, blank=True)
    project_log_doc = models.CharField('项目日志', max_length=500, blank=True)
    stage1_progress = models.FloatField('第一阶段进度', default=0)
    stage2_progress = models.FloatField('第二阶段进度', default=0)
    stage3_progress = models.FloatField('第三阶段进度', default=0)
    ceo_status = models.CharField('CEO', max_length=50, blank=True)
    cpo_status = models.CharField('CPO', max_length=50, blank=True)
    cto_status = models.CharField('CTO', max_length=50, blank=True)
    cmo_status = models.CharField('CMO', max_length=50, blank=True)
    cfo_status = models.CharField('CFO', max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        verbose_name = '队伍'
        verbose_name_plural = '队伍'

    def __str__(self):
        return self.team_name


class Student(models.Model):
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='members', verbose_name='队伍')
    name = models.CharField('姓名', max_length=100)
    english_name = models.CharField('英文名', max_length=100, blank=True)
    grade = models.CharField('年级', max_length=50, blank=True)
    school = models.CharField('学校', max_length=200, blank=True)
    role_in_team = models.CharField('队内角色', max_length=100, blank=True)
    parent_contact = models.CharField('家长联系方式', max_length=100, blank=True)
    notes = models.TextField('备注', blank=True)

    class Meta:
        verbose_name = '学生'
        verbose_name_plural = '学生'

    def __str__(self):
        return self.name
