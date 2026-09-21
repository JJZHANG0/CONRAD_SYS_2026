import sqlite3
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from evaluations.models import TeacherEvaluation
from teams.models import Student, Team


User = get_user_model()


ROLE_MAP = {
    'operations': User.Role.PROJECT_MANAGER,
    'teacher': User.Role.MENTOR,
    'student': User.Role.VIEWER,
}


def parse_legacy_datetime(value):
    if not value:
        return None
    parsed = parse_datetime(value)
    if parsed and timezone.is_naive(parsed):
        parsed = timezone.make_aware(parsed, timezone.get_current_timezone())
    return parsed


def infer_track(category):
    normalized = (category or '').lower()
    mappings = (
        (('network', 'cyber', '网络', '安全'), Team.Track.CYBER),
        (('aerospace', 'space', '航空', '航天'), Team.Track.AEROSPACE),
        (('water', '水'), Team.Track.WATER),
        (('energy', 'environment', '能源', '环境'), Team.Track.ENERGY),
        (('health', 'nutrition', '健康', '营养'), Team.Track.HEALTH),
    )
    for keywords, track in mappings:
        if any(keyword in normalized for keyword in keywords):
            return track
    return Team.Track.SPECIAL


class Command(BaseCommand):
    help = '将旧版康莱德系统的 SQLite 数据安全导入当前系统'

    def add_arguments(self, parser):
        parser.add_argument('--source', required=True, help='旧版 SQLite 备份文件路径')

    def handle(self, *args, **options):
        source = Path(options['source']).expanduser().resolve()
        destination = Path(connection.settings_dict['NAME']).resolve()

        if not source.is_file():
            raise CommandError(f'找不到旧数据库：{source}')
        if source == destination:
            raise CommandError('旧数据库不能与当前数据库是同一个文件')

        legacy = sqlite3.connect(f'file:{source}?mode=ro', uri=True)
        legacy.row_factory = sqlite3.Row
        try:
            self._validate_source(legacy)
            with transaction.atomic():
                users, user_map = self._import_users(legacy)
                teams, team_map = self._import_teams(legacy, user_map)
                students = self._import_members(legacy, user_map, team_map)
                evaluations = self._import_evaluations(legacy, user_map, team_map)
        finally:
            legacy.close()

        self.stdout.write(
            self.style.SUCCESS(
                '旧数据导入完成：'
                f'新增账号 {users}，新增队伍 {teams}，'
                f'新增成员 {students}，新增评价 {evaluations}。'
            )
        )

    def _validate_source(self, legacy):
        integrity = legacy.execute('PRAGMA integrity_check').fetchone()[0]
        if integrity != 'ok':
            raise CommandError(f'旧数据库完整性检查失败：{integrity}')

        tables = {
            row['name']
            for row in legacy.execute("SELECT name FROM sqlite_master WHERE type='table'")
        }
        required = {'accounts_user', 'teams_team', 'teams_teammember'}
        missing = sorted(required - tables)
        if missing:
            raise CommandError(f'旧数据库缺少数据表：{", ".join(missing)}')
        self.legacy_tables = tables

    def _import_users(self, legacy):
        created_count = 0
        user_map = {}
        rows = legacy.execute('SELECT * FROM accounts_user ORDER BY id').fetchall()

        for row in rows:
            legacy_role = row['role'] or 'student'
            defaults = {
                'password': row['password'],
                'last_login': parse_legacy_datetime(row['last_login']),
                'is_superuser': bool(row['is_superuser']),
                'first_name': row['first_name'] or '',
                'last_name': row['last_name'] or '',
                'email': row['email'] or '',
                'is_staff': bool(row['is_staff']),
                'is_active': bool(row['is_active']),
                'date_joined': parse_legacy_datetime(row['date_joined']) or timezone.now(),
                'name': row['display_name'] or row['username'],
                'role': ROLE_MAP.get(legacy_role, User.Role.VIEWER),
                'status': User.Status.ACTIVE if row['is_active'] else User.Status.DISABLED,
            }
            user, created = User.objects.get_or_create(
                username=row['username'],
                defaults=defaults,
            )
            if created:
                created_count += 1
            user_map[row['id']] = user

        return created_count, user_map

    def _co_teachers(self, legacy):
        if 'teams_team_co_teachers' not in self.legacy_tables:
            return {}
        result = {}
        rows = legacy.execute(
            'SELECT team_id, user_id FROM teams_team_co_teachers ORDER BY id'
        ).fetchall()
        for row in rows:
            result.setdefault(row['team_id'], []).append(row['user_id'])
        return result

    def _import_teams(self, legacy, user_map):
        created_count = 0
        team_map = {}
        co_teachers = self._co_teachers(legacy)
        rows = legacy.execute('SELECT * FROM teams_team ORDER BY id').fetchall()

        for row in rows:
            lead_mentor = user_map.get(row['teacher_id'])
            project_manager = None
            co_teacher_names = []
            for legacy_user_id in co_teachers.get(row['id'], []):
                user = user_map.get(legacy_user_id)
                if not user:
                    continue
                co_teacher_names.append(user.name or user.username)
                if user.role == User.Role.PROJECT_MANAGER and project_manager is None:
                    project_manager = user

            description = row['description'] or ''
            legacy_notes = []
            if row['challenge_category']:
                legacy_notes.append(f'旧系统赛道：{row["challenge_category"]}')
            if co_teacher_names:
                legacy_notes.append(f'旧系统协作教师：{" / ".join(co_teacher_names)}')
            if legacy_notes:
                description = '\n'.join(filter(None, [description, *legacy_notes]))

            team = Team.objects.filter(team_name=row['name']).first()
            if team is None:
                team = Team.objects.create(
                    team_name=row['name'],
                    project_name_cn=row['project_name'] or row['name'],
                    track=infer_track(row['challenge_category']),
                    lead_mentor=lead_mentor,
                    project_manager=project_manager,
                    description=description,
                )
                created_count += 1
                Team.objects.filter(pk=team.pk).update(
                    created_at=parse_legacy_datetime(row['created_at']) or timezone.now(),
                    updated_at=parse_legacy_datetime(row['updated_at']) or timezone.now(),
                )
                team.refresh_from_db()
            team_map[row['id']] = team

        return created_count, team_map

    def _import_members(self, legacy, user_map, team_map):
        created_count = 0
        rows = legacy.execute('SELECT * FROM teams_teammember ORDER BY id').fetchall()

        for row in rows:
            team = team_map.get(row['team_id'])
            user = user_map.get(row['student_id'])
            if not team or not user:
                continue

            marker = f'旧系统账号：{user.username}'
            if Student.objects.filter(team=team, notes__contains=marker).exists():
                continue

            legacy_user = legacy.execute(
                'SELECT school, grade, email FROM accounts_user WHERE id = ?',
                (row['student_id'],),
            ).fetchone()
            notes = marker
            if legacy_user['email']:
                notes += f'；邮箱：{legacy_user["email"]}'
            Student.objects.create(
                team=team,
                name=user.name or user.username,
                grade=legacy_user['grade'] or '',
                school=legacy_user['school'] or '',
                role_in_team=row['student_role'] or '',
                notes=notes,
            )
            created_count += 1

        return created_count

    def _import_evaluations(self, legacy, user_map, team_map):
        table = 'teams_teacherdailyevaluation'
        if table not in self.legacy_tables:
            return 0

        created_count = 0
        business_fields = (
            'business_duration',
            'business_correction',
            'business_progress',
            'business_questions',
            'business_log_feedback',
        )
        engineering_fields = (
            'engineering_duration',
            'engineering_development',
            'engineering_review',
            'engineering_progress',
            'engineering_log_feedback',
        )

        rows = legacy.execute(f'SELECT * FROM {table} ORDER BY id').fetchall()
        for row in rows:
            team = team_map.get(row['team_id'])
            if not team or not team.lead_mentor:
                continue
            marker = f'[legacy-daily-evaluation:{row["id"]}]'
            if TeacherEvaluation.objects.filter(comments__contains=marker).exists():
                continue

            business_score = sum(bool(row[field]) for field in business_fields) * 10
            engineering_score = sum(bool(row[field]) for field in engineering_fields) * 10
            comments = '\n'.join(
                filter(
                    None,
                    [
                        marker,
                        f'旧系统第 {row["day"]} 天教师评价',
                        row['comment'] or '',
                    ],
                )
            )
            evaluation = TeacherEvaluation.objects.create(
                mentor=team.lead_mentor,
                team=team,
                score_a=business_score,
                score_b=engineering_score,
                comments=comments,
                evaluated_by=user_map.get(row['reviewed_by_id']),
            )
            TeacherEvaluation.objects.filter(pk=evaluation.pk).update(
                created_at=parse_legacy_datetime(row['created_at']) or timezone.now(),
                updated_at=parse_legacy_datetime(row['updated_at']) or timezone.now(),
            )
            created_count += 1

        return created_count
