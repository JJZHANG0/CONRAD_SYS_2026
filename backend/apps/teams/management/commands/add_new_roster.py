import re

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.teams.models import Team, TeamMember
from apps.teams.services import (
    create_innovation_brief,
    create_lean_canvas,
)


User = get_user_model()

DEFAULT_PASSWORD = "Conrad@2026!"

STAFF = (
    {
        "username": "teacher_wanghaoxuan",
        "display_name": "王皓萱",
        "role": User.Role.TEACHER,
    },
    {
        "username": "teacher_wangzhiheng",
        "display_name": "王志衡",
        "role": User.Role.TEACHER,
    },
    {
        "username": "teacher_haozhenyu",
        "display_name": "郝震煜",
        "role": User.Role.TEACHER,
    },
    {
        "username": "teacher_dubutian",
        "display_name": "杜步天",
        "role": User.Role.TEACHER,
    },
)

TEAMS = (
    {
        "name": "TEAM「蓝域」",
        "project_name": "蓝域",
        "challenge_category": "Water Sustainability",
        "teacher": "王皓萱",
        "operations": "程雪晴",
        "description": "花名册暂无已缴费学生",
    },
    {
        "name": "TEAM「冷驭」",
        "project_name": "冷驭",
        "challenge_category": "Energy & Environment",
        "teacher": "王志衡",
        "operations": "许瑾",
        "description": "",
    },
    {
        "name": "TEAM「隼卫」",
        "project_name": "隼卫",
        "challenge_category": "Aerospace & Aviation",
        "teacher": "郝震煜",
        "operations": "许瑾",
        "description": "",
    },
    {
        "name": "TEAM「清澜环」",
        "project_name": "清澜环",
        "challenge_category": "Water Sustainability",
        "teacher": "杜步天",
        "operations": "许瑾",
        "description": "",
    },
)

STUDENTS = (
    {"username": "student_liangxinyue", "display_name": "梁欣悦", "team": "TEAM「冷驭」", "student_role": "CMO"},
    {"username": "student_chenzeyu", "display_name": "陈泽宇", "team": "TEAM「冷驭」", "student_role": "CEO"},
    {"username": "student_limingyang", "display_name": "李铭阳", "team": "TEAM「冷驭」", "student_role": "CFO"},
    {"username": "student_xuziheng", "display_name": "徐梓桁", "team": "TEAM「隼卫」", "student_role": "CTO"},
    {"username": "student_luzijian", "display_name": "卢子健", "team": "TEAM「隼卫」", "student_role": "CPO"},
    {"username": "student_humengyao", "display_name": "胡孟瑶", "team": "TEAM「隼卫」", "student_role": "CTO"},
    {"username": "student_wangruiyan", "display_name": "王睿妍", "team": "TEAM「隼卫」", "student_role": "CMO"},
    {"username": "student_wangyuan", "display_name": "王元", "team": "TEAM「隼卫」", "student_role": "CTO"},
    {"username": "student_gaoruiqin", "display_name": "高睿沁", "team": "TEAM「清澜环」", "student_role": ""},
    {"username": "student_xiechenyue", "display_name": "谢辰悦", "team": "TEAM「清澜环」", "student_role": ""},
    {"username": "student_chenzilin", "display_name": "陈梓琳", "team": "TEAM「清澜环」", "student_role": "CMO"},
    {"username": "student_wangtairan", "display_name": "王泰然", "team": "TEAM「清澜环」", "student_role": ""},
)


def normalize_team_name(value):
    return re.sub(r"\s+", "", value or "").casefold()


class Command(BaseCommand):
    help = "Add the September teachers, operations users, teams, and students without changing existing team content"

    def add_arguments(self, parser):
        parser.add_argument(
            "--password",
            default=DEFAULT_PASSWORD,
            help="Initial password used only for newly created accounts",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show the import plan without writing to the database",
        )

    def handle(self, *args, **options):
        password = options["password"]
        if options["dry_run"]:
            self._show_plan()
            return

        with transaction.atomic():
            staff_created = self._ensure_staff(password)
            teams_created, team_map = self._ensure_teams()
            students_created, members_created = self._ensure_students(
                password,
                team_map,
            )

        self.stdout.write(
            self.style.SUCCESS(
                "Incremental roster import complete: "
                f"staff created {staff_created}, teams created {teams_created}, "
                f"students created {students_created}, memberships created {members_created}."
            )
        )

    def _show_plan(self):
        self.stdout.write("Staff:")
        for item in STAFF:
            self.stdout.write(f"  {item['display_name']} ({item['role']})")
        self.stdout.write("Teams:")
        for item in TEAMS:
            self.stdout.write(
                f"  {item['name']} - {item['teacher']} / {item['operations']}"
            )
        self.stdout.write("Students:")
        for item in STUDENTS:
            self.stdout.write(
                f"  {item['display_name']} ({item['student_role']}) -> {item['team']}"
            )
        self.stdout.write(self.style.SUCCESS("Dry run complete; no data changed."))

    def _user_by_display_name(self, display_name, expected_role=None):
        matches = User.objects.filter(display_name=display_name)
        if matches.count() > 1:
            raise CommandError(f"Multiple accounts use the name {display_name}")
        user = matches.first()
        if user and expected_role and user.role != expected_role:
            raise CommandError(
                f"{display_name} already exists with role {user.role}, "
                f"expected {expected_role}"
            )
        return user

    def _create_named_user(self, item, password):
        existing = self._user_by_display_name(item["display_name"], item["role"])
        if existing:
            return existing, False
        if User.objects.filter(username=item["username"]).exists():
            raise CommandError(f"Username already exists: {item['username']}")

        user = User.objects.create_user(
            username=item["username"],
            password=password,
            email=f"{item['username']}@conrad.local",
            role=item["role"],
            display_name=item["display_name"],
            is_active=True,
            is_staff=item["role"] == User.Role.OPERATIONS,
        )
        return user, True

    def _ensure_staff(self, password):
        created_count = 0
        for item in STAFF:
            user, created = self._create_named_user(item, password)
            created_count += int(created)
            self.stdout.write(
                f"{'Created' if created else 'Kept'} staff: "
                f"{user.display_name} ({user.username})"
            )
        return created_count

    def _find_team(self, name):
        normalized = normalize_team_name(name)
        matches = [
            team
            for team in Team.objects.all()
            if normalize_team_name(team.name) == normalized
        ]
        if len(matches) > 1:
            raise CommandError(f"Multiple teams match the normalized name {name}")
        return matches[0] if matches else None

    def _ensure_teams(self):
        created_count = 0
        team_map = {}
        for item in TEAMS:
            teacher = self._user_by_display_name(
                item["teacher"],
                User.Role.TEACHER,
            )
            operations = self._user_by_display_name(
                item["operations"],
                User.Role.OPERATIONS,
            )
            if not teacher:
                raise CommandError(f"Teacher not found: {item['teacher']}")
            if not operations:
                raise CommandError(f"Operations user not found: {item['operations']}")

            team = self._find_team(item["name"])
            created = team is None
            if created:
                team = Team.objects.create(
                    name=item["name"],
                    project_name=item["project_name"],
                    challenge_category=item["challenge_category"],
                    teacher=teacher,
                    description=item["description"],
                )
                created_count += 1

            team.co_teachers.add(operations)
            create_innovation_brief(team)
            create_lean_canvas(team)
            team_map[item["name"]] = team
            self.stdout.write(
                f"{'Created' if created else 'Kept'} team: {team.name}"
            )
        return created_count, team_map

    def _ensure_students(self, password, team_map):
        students_created = 0
        members_created = 0
        for item in STUDENTS:
            student_item = {
                **item,
                "role": User.Role.STUDENT,
            }
            student, created = self._create_named_user(student_item, password)
            students_created += int(created)
            team = team_map[item["team"]]

            membership, member_created = TeamMember.objects.get_or_create(
                team=team,
                student=student,
                defaults={"student_role": item["student_role"]},
            )
            if not member_created and membership.student_role != item["student_role"]:
                raise CommandError(
                    f"{student.display_name} already has role "
                    f"{membership.student_role}, expected {item['student_role']}"
                )
            members_created += int(member_created)
            self.stdout.write(
                f"{'Created' if created else 'Kept'} student: "
                f"{student.display_name}; "
                f"{'added' if member_created else 'kept'} membership in {team.name}"
            )
        return students_created, members_created
