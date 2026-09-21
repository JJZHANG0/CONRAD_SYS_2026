import sqlite3
import tempfile
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase

from evaluations.models import TeacherEvaluation
from teams.models import Student, Team


User = get_user_model()


class ImportLegacyDataTests(TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.legacy_path = Path(self.temp_dir.name) / 'legacy.sqlite3'
        legacy = sqlite3.connect(self.legacy_path)
        legacy.executescript(
            """
            CREATE TABLE accounts_user (
                id INTEGER PRIMARY KEY,
                password VARCHAR(128) NOT NULL,
                last_login DATETIME,
                is_superuser BOOL NOT NULL,
                username VARCHAR(150) NOT NULL UNIQUE,
                first_name VARCHAR(150) NOT NULL,
                last_name VARCHAR(150) NOT NULL,
                is_staff BOOL NOT NULL,
                is_active BOOL NOT NULL,
                date_joined DATETIME NOT NULL,
                email VARCHAR(254) NOT NULL,
                role VARCHAR(20) NOT NULL,
                display_name VARCHAR(100) NOT NULL,
                school VARCHAR(200) NOT NULL,
                grade VARCHAR(50) NOT NULL,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL
            );
            CREATE TABLE teams_team (
                id INTEGER PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                project_name VARCHAR(200) NOT NULL,
                challenge_category VARCHAR(200) NOT NULL,
                description TEXT NOT NULL,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL,
                teacher_id BIGINT NOT NULL
            );
            CREATE TABLE teams_teammember (
                id INTEGER PRIMARY KEY,
                student_role VARCHAR(50) NOT NULL,
                created_at DATETIME NOT NULL,
                student_id BIGINT NOT NULL,
                team_id BIGINT NOT NULL
            );
            CREATE TABLE teams_team_co_teachers (
                id INTEGER PRIMARY KEY,
                team_id BIGINT NOT NULL,
                user_id BIGINT NOT NULL
            );
            CREATE TABLE teams_teacherdailyevaluation (
                id INTEGER PRIMARY KEY,
                day INTEGER NOT NULL,
                business_duration BOOL NOT NULL,
                business_correction BOOL NOT NULL,
                business_progress BOOL NOT NULL,
                business_questions BOOL NOT NULL,
                business_log_feedback BOOL NOT NULL,
                engineering_duration BOOL NOT NULL,
                engineering_development BOOL NOT NULL,
                engineering_review BOOL NOT NULL,
                engineering_progress BOOL NOT NULL,
                engineering_log_feedback BOOL NOT NULL,
                comment TEXT NOT NULL,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL,
                reviewed_by_id BIGINT,
                team_id BIGINT NOT NULL
            );
            """
        )
        timestamp = '2026-09-01 08:00:00'
        users = [
            (1, 'pbkdf2_sha256$legacy-teacher', 0, 'teacher1', 0, 1,
             'teacher@example.com', 'teacher', '张老师', '', ''),
            (2, 'pbkdf2_sha256$legacy-student', 0, 'student1', 0, 1,
             'student@example.com', 'student', '学生甲', '示例学校', '九年级'),
            (3, 'pbkdf2_sha256$legacy-ops', 1, 'operations1', 1, 1,
             'ops@example.com', 'operations', '运营老师', '', ''),
        ]
        for row in users:
            legacy.execute(
                """
                INSERT INTO accounts_user (
                    id, password, last_login, is_superuser, username,
                    first_name, last_name, is_staff, is_active, date_joined,
                    email, role, display_name, school, grade, created_at, updated_at
                ) VALUES (?, ?, NULL, ?, ?, '', '', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (*row[:5], row[5], timestamp, *row[6:], timestamp, timestamp),
            )
        legacy.execute(
            """
            INSERT INTO teams_team VALUES
            (1, 'TEAM 「测试队」', '测试项目', '网络安全', '原队伍说明', ?, ?, 1)
            """,
            (timestamp, timestamp),
        )
        legacy.execute(
            "INSERT INTO teams_teammember VALUES (1, 'CEO', ?, 2, 1)",
            (timestamp,),
        )
        legacy.execute("INSERT INTO teams_team_co_teachers VALUES (1, 1, 3)")
        legacy.execute(
            """
            INSERT INTO teams_teacherdailyevaluation VALUES
            (1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
             '整体表现良好', ?, ?, 3, 1)
            """,
            (timestamp, timestamp),
        )
        legacy.commit()
        legacy.close()

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_imports_legacy_records_and_is_idempotent(self):
        call_command('import_legacy_data', source=str(self.legacy_path))
        call_command('import_legacy_data', source=str(self.legacy_path))

        self.assertEqual(User.objects.count(), 3)
        self.assertEqual(Team.objects.count(), 1)
        self.assertEqual(Student.objects.count(), 1)
        self.assertEqual(TeacherEvaluation.objects.count(), 1)

        teacher = User.objects.get(username='teacher1')
        operations = User.objects.get(username='operations1')
        student_user = User.objects.get(username='student1')
        team = Team.objects.get()
        student = Student.objects.get()
        evaluation = TeacherEvaluation.objects.get()

        self.assertEqual(teacher.role, User.Role.MENTOR)
        self.assertEqual(operations.role, User.Role.PROJECT_MANAGER)
        self.assertEqual(student_user.role, User.Role.VIEWER)
        self.assertEqual(student_user.password, 'pbkdf2_sha256$legacy-student')
        self.assertEqual(team.lead_mentor, teacher)
        self.assertEqual(team.project_manager, operations)
        self.assertEqual(team.track, Team.Track.CYBER)
        self.assertEqual(student.name, '学生甲')
        self.assertEqual(student.school, '示例学校')
        self.assertEqual(evaluation.evaluated_by, operations)
        self.assertEqual(evaluation.total_score, 100)
