from django.db import models
from django.conf import settings


class TemplateResource(models.Model):
    title = models.CharField('模板名称', max_length=300)
    stage = models.ForeignKey('teams.Stage', on_delete=models.SET_NULL, null=True, blank=True)
    category = models.CharField('分类', max_length=100)
    description = models.TextField('适用场景', blank=True)
    file_url = models.URLField('文件链接', blank=True)
    external_link = models.URLField('外部链接', blank=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name='uploaded_templates', verbose_name='上传人'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['stage__order', 'title']
        verbose_name = '模板资源'
        verbose_name_plural = '模板资源'

    def __str__(self):
        return self.title
