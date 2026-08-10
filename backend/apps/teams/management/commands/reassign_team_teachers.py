"""One-off / reusable team teacher reassignment helpers."""
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db.models import Q

from apps.teams.models import Team

User = get_user_model()


def find_teacher(name: str):
    user = (
        User.objects.filter(display_name=name).first()
        or User.objects.filter(username=name).first()
    )
    if not user:
        raise CommandError(f"找不到账号：{name}")
    return user


def find_team(keyword: str, teacher=None):
    query = Team.objects.filter(
        Q(name__icontains=keyword) | Q(project_name__icontains=keyword)
    )
    if teacher is not None:
        query = query.filter(teacher=teacher)
    teams = list(query.distinct())
    if not teams:
        raise CommandError(f"找不到队伍：{keyword}")
    if len(teams) > 1:
        listing = ", ".join(f"{t.id}:{t.name}" for t in teams)
        raise CommandError(f"匹配到多个队伍（{keyword}）：{listing}")
    return teams[0]


class Command(BaseCommand):
    help = (
        "Reassign 加密目镜 to 张捷嘉, and add 潘厚安 as co-teacher of 天巡者."
    )

    def handle(self, *args, **options):
        zhang = find_teacher("张捷嘉")
        if zhang.role != User.Role.TEACHER:
            raise CommandError("张捷嘉 不是教师账号")

        xia = find_teacher("夏宏伟")
        jiami = find_team("加密目镜", teacher=xia)
        old_teacher_name = jiami.teacher.display_name
        jiami.teacher = zhang
        jiami.save(update_fields=["teacher", "updated_at"])
        self.stdout.write(
            self.style.SUCCESS(
                f"已将「{jiami.name}」从 {old_teacher_name} 转给 {zhang.display_name}"
            )
        )

        pan = find_teacher("潘厚安")
        tianxunzhe = find_team("天巡者")
        if tianxunzhe.teacher_id == pan.id:
            self.stdout.write("潘厚安 已是天巡者主带老师，跳过副老师添加")
        else:
            tianxunzhe.co_teachers.add(pan)
            self.stdout.write(
                self.style.SUCCESS(
                    f"已将 {pan.display_name} 添加为「{tianxunzhe.name}」副老师；"
                    f"当前老师：{tianxunzhe.teacher_names_text()}"
                )
            )

        self.stdout.write(self.style.SUCCESS("DONE"))
