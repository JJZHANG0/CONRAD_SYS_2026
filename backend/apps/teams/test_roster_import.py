from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase

from apps.bmc.models import LeanCanvas
from apps.briefs.models import InnovationBrief
from apps.teams.models import Team, TeamMember


User = get_user_model()


class AddNewRosterCommandTests(TestCase):
    def setUp(self):
        self.cheng = User.objects.create_user(
            username="ops_cheng",
            password="existing-password",
            email="chengxueqing@conrad.local",
            role=User.Role.OPERATIONS,
            display_name="程雪晴",
        )
        self.xu = User.objects.create_user(
            username="ops_xu",
            password="existing-password",
            email="xujin@conrad.local",
            role=User.Role.OPERATIONS,
            display_name="许瑾",
        )

    def test_import_is_complete_and_idempotent(self):
        call_command("add_new_roster")
        call_command("add_new_roster")

        self.assertEqual(Team.objects.count(), 3)
        self.assertEqual(TeamMember.objects.count(), 8)
        self.assertEqual(LeanCanvas.objects.count(), 3)
        self.assertEqual(InnovationBrief.objects.count(), 3)
        self.assertEqual(
            sum(team.daily_logs.count() for team in Team.objects.all()),
            0,
        )

        cold_team = Team.objects.get(name="TEAM「冷驭」")
        falcon_team = Team.objects.get(name="TEAM「隼卫」")
        blue_team = Team.objects.get(name="TEAM「蓝域」")

        self.assertEqual(cold_team.members.count(), 3)
        self.assertEqual(falcon_team.members.count(), 5)
        self.assertEqual(blue_team.members.count(), 0)
        self.assertEqual(blue_team.description, "花名册暂无已缴费学生")
        self.assertEqual(cold_team.teacher.display_name, "王志衡")
        self.assertEqual(
            list(cold_team.co_teachers.values_list("display_name", flat=True)),
            ["许瑾"],
        )

        liang = User.objects.get(display_name="梁欣悦")
        self.assertTrue(liang.check_password("Conrad@2026!"))
        self.assertEqual(
            TeamMember.objects.get(student=liang).student_role,
            "CMO",
        )

    def test_existing_normalized_team_and_content_are_preserved(self):
        existing_teacher = User.objects.create_user(
            username="existing-blue-teacher",
            password="existing-password",
            email="existing-blue@example.com",
            role=User.Role.TEACHER,
            display_name="原蓝域老师",
        )
        team = Team.objects.create(
            name="TEAM 「蓝域」",
            project_name="原蓝域项目",
            challenge_category="Water Sustainability",
            teacher=existing_teacher,
            description="原队伍说明",
        )
        canvas = LeanCanvas.objects.create(team=team, problem="原 BMC 内容")
        brief = InnovationBrief.objects.create(team=team, opportunity="原 Brief 内容")

        call_command("add_new_roster")

        team.refresh_from_db()
        canvas.refresh_from_db()
        brief.refresh_from_db()
        self.assertEqual(Team.objects.filter(name__contains="蓝域").count(), 1)
        self.assertEqual(team.project_name, "原蓝域项目")
        self.assertEqual(team.teacher, existing_teacher)
        self.assertEqual(team.description, "原队伍说明")
        self.assertEqual(canvas.problem, "原 BMC 内容")
        self.assertEqual(brief.opportunity, "原 Brief 内容")
        self.assertTrue(team.co_teachers.filter(pk=self.cheng.pk).exists())
