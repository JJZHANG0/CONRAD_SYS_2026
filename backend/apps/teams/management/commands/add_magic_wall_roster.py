import re

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.teams.models import Team, TeamMember
from apps.teams.services import (
    create_daily_logs_for_member,
    create_innovation_brief,
    create_lean_canvas,
)

User = get_user_model()

DEFAULT_PASSWORD = "Conrad@2026!"
MAGIC_WALL_TEAM = "TEAM「魔术墙」"
XUN_TEAM_PROJECT = "埙"

STUDENTS = (
    ("student_fanxinwen", "范馨文"),
    ("student_tianchenrui", "田晨瑞"),
    ("student_pengjunlin", "彭俊霖"),
    ("student_huangqirui", "黄启睿"),
    ("student_leosu", "Leo Su"),
)


def normalize_team_name(value):
    return re.sub(r"\s+", "", value or "").casefold()


class Command(BaseCommand):
    help = "Add the Magic Wall roster and safely reassign TEAM XUN/埙"

    def add_arguments(self, parser):
        parser.add_argument(
            "--challenge-category",
            required=True,
            help="Conrad challenge category for TEAM「魔术墙」",
        )
        parser.add_argument(
            "--password",
            default=DEFAULT_PASSWORD,
            help="Initial password used only for newly created accounts",
        )

    def handle(self, *args, **options):
        with transaction.atomic():
            teacher_zhang = self._staff("张捷嘉", User.Role.TEACHER)
            operations_cheng = self._staff("程雪晴", User.Role.OPERATIONS)
            operations_zhang = self._staff("张雪航", User.Role.OPERATIONS)
            teacher_luo, teacher_created = self._ensure_teacher(
                options["password"]
            )
            magic_wall, team_created = self._ensure_magic_wall(
                teacher_zhang,
                operations_cheng,
                options["challenge_category"],
            )
            students_created, memberships_created = self._ensure_students(
                magic_wall,
                options["password"],
            )
            xun = self._reassign_xun(teacher_luo, operations_zhang)

        self.stdout.write(
            self.style.SUCCESS(
                "Magic Wall roster complete: "
                f"team created {int(team_created)}, "
                f"students created {students_created}, "
                f"memberships created {memberships_created}; "
                f"{xun.name} assigned to {teacher_luo.display_name}."
            )
        )
        self.stdout.write(
            f"Luo Chao account: {teacher_luo.username} "
            f"({'created' if teacher_created else 'kept'})"
        )

    def _staff(self, display_name, role):
        matches = User.objects.filter(display_name=display_name)
        if matches.count() != 1:
            raise CommandError(
                f"Expected exactly one account for {display_name}, "
                f"found {matches.count()}"
            )
        user = matches.first()
        if user.role != role:
            raise CommandError(
                f"{display_name} has role {user.role}, expected {role}"
            )
        return user

    def _ensure_teacher(self, password):
        existing = User.objects.filter(display_name="罗超")
        if existing.count() > 1:
            raise CommandError("Multiple accounts use the name 罗超")
        teacher = existing.first()
        if teacher:
            if teacher.role != User.Role.TEACHER:
                raise CommandError("罗超 already exists but is not a teacher")
            return teacher, False
        if User.objects.filter(username="teacher_luochao").exists():
            raise CommandError("Username already exists: teacher_luochao")
        teacher = User.objects.create_user(
            username="teacher_luochao",
            password=password,
            email="teacher_luochao@conrad.local",
            role=User.Role.TEACHER,
            display_name="罗超",
            is_active=True,
        )
        return teacher, True

    def _find_team(self, name):
        normalized = normalize_team_name(name)
        matches = [
            team
            for team in Team.objects.all()
            if normalize_team_name(team.name) == normalized
        ]
        if len(matches) > 1:
            raise CommandError(f"Multiple teams match {name}")
        return matches[0] if matches else None

    def _ensure_magic_wall(
        self,
        teacher,
        operations,
        challenge_category,
    ):
        team = self._find_team(MAGIC_WALL_TEAM)
        created = team is None
        if created:
            team = Team.objects.create(
                name=MAGIC_WALL_TEAM,
                project_name="魔术墙",
                challenge_category=challenge_category,
                teacher=teacher,
                description="",
            )
        elif team.teacher_id != teacher.id:
            raise CommandError(
                f"{team.name} already belongs to {team.teacher.display_name}"
            )
        team.co_teachers.add(operations)
        create_innovation_brief(team)
        create_lean_canvas(team)
        return team, created

    def _ensure_students(self, team, password):
        students_created = 0
        memberships_created = 0
        for username, display_name in STUDENTS:
            matches = User.objects.filter(display_name=display_name)
            if matches.count() > 1:
                raise CommandError(
                    f"Multiple accounts use the name {display_name}"
                )
            student = matches.first()
            if student:
                if student.role != User.Role.STUDENT:
                    raise CommandError(
                        f"{display_name} already exists but is not a student"
                    )
            else:
                if User.objects.filter(username=username).exists():
                    raise CommandError(f"Username already exists: {username}")
                student = User.objects.create_user(
                    username=username,
                    password=password,
                    email=f"{username}@conrad.local",
                    role=User.Role.STUDENT,
                    display_name=display_name,
                    is_active=True,
                )
                students_created += 1

            _, created = TeamMember.objects.get_or_create(
                team=team,
                student=student,
                defaults={"student_role": ""},
            )
            memberships_created += int(created)
            create_daily_logs_for_member(team, student)
        return students_created, memberships_created

    def _reassign_xun(self, teacher, operations):
        matches = Team.objects.filter(project_name=XUN_TEAM_PROJECT)
        if matches.count() != 1:
            raise CommandError(
                f"Expected exactly one XUN/埙 team, found {matches.count()}"
            )
        team = matches.first()
        if team.teacher_id != teacher.id:
            team.teacher = teacher
            team.save(update_fields=["teacher", "updated_at"])
        team.co_teachers.add(operations)
        return team
