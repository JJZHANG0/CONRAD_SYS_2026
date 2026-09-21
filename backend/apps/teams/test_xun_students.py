from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase

from apps.logs.models import DailyLog
from apps.teams.models import Team, TeamMember


User = get_user_model()


class AddXunStudentsCommandTests(TestCase):
    def test_adds_only_missing_students_and_preserves_existing_logs(self):
        teacher = User.objects.create_user(
            username="teacher_luochao",
            password="existing-password",
            email="teacher_luochao@conrad.local",
            role=User.Role.TEACHER,
            display_name="罗超",
        )
        team = Team.objects.create(
            name="TEAM「埙」",
            project_name="埙",
            teacher=teacher,
        )
        existing_student = User.objects.create_user(
            username="student_076",
            password="existing-password",
            email="student076@conrad.local",
            role=User.Role.STUDENT,
            display_name="高海川",
        )
        TeamMember.objects.create(
            team=team,
            student=existing_student,
            student_role="CPO - 产品工程负责人",
        )
        existing_log = DailyLog.objects.create(
            team=team,
            student=existing_student,
            day=1,
            work_content="原有日志，必须保留",
        )

        call_command("add_xun_students")
        call_command("add_xun_students")

        self.assertEqual(team.members.count(), 5)
        self.assertEqual(team.daily_logs.count(), 25)
        self.assertEqual(User.objects.filter(role=User.Role.STUDENT).count(), 5)

        existing_student.refresh_from_db()
        existing_log.refresh_from_db()
        self.assertEqual(existing_student.username, "student_076")
        self.assertEqual(existing_log.work_content, "原有日志，必须保留")
        self.assertEqual(
            TeamMember.objects.get(student=existing_student).student_role,
            "CPO - 产品工程负责人",
        )

        expected_accounts = {
            "肖俊逸": "student_xiaojunyi",
            "马睿齐": "student_maruiqi",
            "吴思义": "student_wusiyi",
            "唐亦阳": "student_tangyiyang",
        }
        for display_name, username in expected_accounts.items():
            student = User.objects.get(display_name=display_name)
            self.assertEqual(student.username, username)
            self.assertTrue(student.check_password("Conrad@2026!"))
            logs = DailyLog.objects.filter(team=team, student=student)
            self.assertEqual(logs.count(), 5)
            self.assertTrue(all(not log.is_complete for log in logs))
