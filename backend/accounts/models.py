from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        SUPER_ADMIN = 'super_admin', 'Super Admin'
        PROJECT_MANAGER = 'project_manager', '项目经理'
        ACADEMIC_ADMIN = 'academic_admin', '教务老师'
        MENTOR = 'mentor', '导师'
        VIEWER = 'viewer', '查看者'

    class Status(models.TextChoices):
        ACTIVE = 'active', '正常'
        DISABLED = 'disabled', '禁用'

    name = models.CharField('姓名', max_length=100, blank=True)
    phone = models.CharField('电话', max_length=20, blank=True)
    role = models.CharField('角色', max_length=20, choices=Role.choices, default=Role.VIEWER)
    avatar = models.URLField('头像', blank=True)
    status = models.CharField('状态', max_length=20, choices=Status.choices, default=Status.ACTIVE)

    class Meta:
        verbose_name = '用户'
        verbose_name_plural = '用户'

    def __str__(self):
        return self.name or self.username
