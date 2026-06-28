from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.briefs.models import InnovationBrief
from apps.logs.models import DailyLog
from apps.teams.models import Team, TeamMember
from apps.teams.services import create_daily_logs_for_member, create_innovation_brief

User = get_user_model()

TEACHER = {
    "username": "teacher_demo",
    "password": "demo123456",
    "role": "teacher",
    "display_name": "钱老师",
    "email": "teacher@demo.com",
}

STUDENTS = [
    {"username": f"student0{i}", "password": "demo123456", "role": "student",
     "display_name": f"学生{'一二三四五'[i-1]}", "school": "杭州 XXX 中学", "grade": "G10",
     "email": f"student0{i}@demo.com"}
    for i in range(1, 6)
]

ROLES = ["CEO", "CTO", "CMO", "CPO", "Designer"]

SAMPLE_DAY1 = {
    "work_content": "今天完成了用户需求调研，整理了 dormitory sleep quality 相关问卷数据，并与队友讨论了 Mimo Smart Pillow 的核心功能方向。",
    "task_completion": "完成了 20 份问卷回收与初步分析，确定了 3 个主要痛点；原型草图完成 60%，还需补充传感器模块说明。",
    "problems_solutions": "遇到的问题是问卷样本集中在同一宿舍楼。解决方式：扩展到相邻两栋楼重新发放，并请老师帮忙联系更多样本。",
    "reflection": "今天最大的收获是学会了用数据支撑问题定义。明天需要完成竞品分析并开始绘制第一版产品框架图。",
}


class Command(BaseCommand):
    help = "Seed demo teacher, 5 students, Team Mimo with logs and brief"

    def handle(self, *args, **options):
        teacher_data = {**TEACHER}
        password = teacher_data.pop("password")
        teacher, _ = User.objects.update_or_create(username=teacher_data["username"], defaults=teacher_data)
        teacher.set_password(password)
        teacher.save()
        self.stdout.write(f"Teacher: {teacher.username}")

        students = []
        for i, s in enumerate(STUDENTS):
            data = {**s}
            pwd = data.pop("password")
            user, _ = User.objects.update_or_create(username=data["username"], defaults=data)
            user.set_password(pwd)
            user.save()
            students.append(user)
            self.stdout.write(f"Student: {user.username}")

        team, created = Team.objects.update_or_create(
            name="Team Mimo",
            defaults={
                "project_name": "Mimo Smart Pillow",
                "challenge_category": "Health & Nutrition",
                "teacher": teacher,
                "description": "智能枕头项目 — 改善宿舍睡眠质量",
            },
        )

        for i, student in enumerate(students):
            TeamMember.objects.get_or_create(
                team=team, student=student,
                defaults={"student_role": ROLES[i]},
            )
            create_daily_logs_for_member(team, student)

        create_innovation_brief(team)

        log = DailyLog.objects.get(team=team, student=students[0], day=1)
        for k, v in SAMPLE_DAY1.items():
            setattr(log, k, v)
        log.save()

        brief = InnovationBrief.objects.get(team=team)
        brief.elevator_pitch = (
            "Mimo Smart Pillow is an adaptive sleep system that tracks sleep quality and adjusts firmness "
            "for dormitory students — improving rest, health, and daily performance."
        )
        brief.opportunity = (
            "Dormitory students suffer from poor sleep due to noise, uncomfortable pillows, "
            "and lack of personalized sleep tracking."
        )
        brief.save()

        self.stdout.write(self.style.SUCCESS(f"Team '{team.name}' ready with 25 daily logs."))
        self.stdout.write(self.style.SUCCESS("Login: teacher_demo or student01-05 / demo123456"))
