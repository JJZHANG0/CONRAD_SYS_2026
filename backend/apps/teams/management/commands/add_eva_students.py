from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.teams.models import Team, TeamMember
from apps.teams.services import create_daily_logs_for_member


User = get_user_model()

DEFAULT_PASSWORD = "Conrad@2026!"
EVA_PROJECT_NAME = "舱外太空工具"
EVA_STUDENTS = (
    ("student_danruiyang", "但睿洋"),
    ("student_mahaoxuan", "马颢轩"),
    ("student_xiayihan", "夏翊涵"),
    ("student_lijiyuan", "李纪源"),
    ("student_gaowenchu", "高文楚"),
)


class Command(BaseCommand):
    help = "Add missing EVA students without changing existing logs"

    def add_arguments(self, parser):
        parser.add_argument(
            "--password",
            default=DEFAULT_PASSWORD,
            help="Initial password used only for newly created accounts",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        teams = Team.objects.filter(project_name=EVA_PROJECT_NAME)
        if teams.count() != 1:
            raise CommandError(
                f"Expected exactly one EVA team, found {teams.count()}"
            )
        team = teams.first()

        students_created = 0
        memberships_created = 0
        for preferred_username, display_name in EVA_STUDENTS:
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
                if User.objects.filter(username=preferred_username).exists():
                    raise CommandError(
                        f"Username already exists: {preferred_username}"
                    )
                student = User.objects.create_user(
                    username=preferred_username,
                    password=options["password"],
                    email=f"{preferred_username}@conrad.local",
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
            self.stdout.write(
                f"{'Added' if created else 'Kept'} student: "
                f"{display_name} ({student.username})"
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"EVA roster complete: students created {students_created}, "
                f"memberships created {memberships_created}."
            )
        )
