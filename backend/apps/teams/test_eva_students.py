from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase

from apps.logs.models import DailyLog
from apps.teams.models import Team, TeamMember


User = get_user_model()


class AddEvaStudentsCommandTests(TestCase):
    def test_adds_only_missing_students_and_preserves_existing_logs(self):
        teacher = User.objects.create_user(
            username="teacher_lijinjian",
            password="existing-password",
            email="teacher_lijinjian@conrad.local",
            role=User.Role.TEACHER,
            display_name="李进坚",
        )
        team = Team.objects.create(
            name="TEAM「舱外太空工具」",
            project_name="舱外太空工具",
            teacher=teacher,
        )
        dan = User.objects.create_user(
            username="student_032",
            password="existing-password",
            email="student032@conrad.local",
            role=User.Role.STUDENT,
            display_name="但睿洋",
        )
        ma = User.objects.create_user(
            username="student_072",
            password="existing-password",
            email="student072@conrad.local",
            role=User.Role.STUDENT,
            display_name="马颢轩",
        )
        TeamMember.objects.create(team=team, student=dan, student_role="CPO")
        TeamMember.objects.create(
            team=team,
            student=ma,
            student_role="CPO - 产品工程负责人",
        )
        existing_log = DailyLog.objects.create(
            team=team,
            student=dan,
            day=1,
            work_content="原有 EVA 日志，必须保留",
        )

        call_command("add_eva_students")
        call_command("add_eva_students")

        self.assertEqual(team.members.count(), 5)
        self.assertEqual(team.daily_logs.count(), 25)
        self.assertEqual(User.objects.filter(role=User.Role.STUDENT).count(), 5)

        existing_log.refresh_from_db()
        self.assertEqual(existing_log.work_content, "原有 EVA 日志，必须保留")
        self.assertEqual(User.objects.get(display_name="但睿洋").username, "student_032")
        self.assertEqual(User.objects.get(display_name="马颢轩").username, "student_072")
        self.assertEqual(TeamMember.objects.get(student=dan).student_role, "CPO")
        self.assertEqual(
            TeamMember.objects.get(student=ma).student_role,
            "CPO - 产品工程负责人",
        )

        expected_accounts = {
            "夏翊涵": "student_xiayihan",
            "李纪源": "student_lijiyuan",
            "高文楚": "student_gaowenchu",
        }
        for display_name, username in expected_accounts.items():
            student = User.objects.get(display_name=display_name)
            self.assertEqual(student.username, username)
            self.assertTrue(student.check_password("Conrad@2026!"))
            logs = DailyLog.objects.filter(team=team, student=student)
            self.assertEqual(logs.count(), 5)
            self.assertTrue(all(not log.is_complete for log in logs))
