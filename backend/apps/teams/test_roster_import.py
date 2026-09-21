from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from apps.bmc.models import LeanCanvas
from apps.briefs.models import InnovationBrief
from apps.logs.models import DailyLog
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

        self.assertEqual(Team.objects.count(), 4)
        self.assertEqual(TeamMember.objects.count(), 12)
        self.assertEqual(LeanCanvas.objects.count(), 4)
        self.assertEqual(InnovationBrief.objects.count(), 4)
        self.assertEqual(
            sum(team.daily_logs.count() for team in Team.objects.all()),
            60,
        )
        self.assertFalse(DailyLog.objects.filter(work_content__gt="").exists())
        self.assertFalse(DailyLog.objects.filter(task_completion__gt="").exists())
        self.assertFalse(DailyLog.objects.filter(problems_solutions__gt="").exists())
        self.assertFalse(DailyLog.objects.filter(reflection__gt="").exists())

        cold_team = Team.objects.get(name="TEAM「冷驭」")
        falcon_team = Team.objects.get(name="TEAM「隼卫」")
        blue_team = Team.objects.get(name="TEAM「蓝域」")
        qinglan_team = Team.objects.get(name="TEAM「清澜环」")

        self.assertEqual(cold_team.members.count(), 3)
        self.assertEqual(falcon_team.members.count(), 5)
        self.assertEqual(blue_team.members.count(), 0)
        self.assertEqual(qinglan_team.members.count(), 4)
        self.assertEqual(qinglan_team.teacher.display_name, "杜步天")
        self.assertEqual(qinglan_team.challenge_category, "Energy & Environment")
        self.assertEqual(falcon_team.teacher.display_name, "郝震焜")
        self.assertEqual(falcon_team.teacher.username, "teacher_haozhenkun")
        self.assertTrue(qinglan_team.co_teachers.filter(pk=self.xu.pk).exists())
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
        chen = User.objects.get(display_name="陈梓琳")
        self.assertEqual(
            TeamMember.objects.get(student=chen).student_role,
            "CMO",
        )

        gaoruiqin = User.objects.get(display_name="高睿沁")
        client = APIClient()
        client.force_authenticate(gaoruiqin)
        response = client.get(reverse("my-logs"), {"team": qinglan_team.id})
        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["day"] for item in response.data], [1, 2, 3, 4, 5])
        self.assertTrue(all(not item["is_complete"] for item in response.data))

    def test_existing_student_can_join_second_team_without_moving_logs(self):
        existing_teacher = User.objects.create_user(
            username="teacher-smart-run",
            password="existing-password",
            email="teacher-smart-run@example.com",
            role=User.Role.TEACHER,
            display_name="智跑老师",
        )
        smart_run = Team.objects.create(
            name="TEAM「智跑」",
            project_name="智跑",
            teacher=existing_teacher,
        )
        xie = User.objects.create_user(
            username="谢辰悦",
            password="existing-password",
            email="xiechenyue@example.com",
            role=User.Role.STUDENT,
            display_name="谢辰悦",
        )
        TeamMember.objects.create(team=smart_run, student=xie)
        existing_log = DailyLog.objects.create(
            team=smart_run,
            student=xie,
            day=1,
            work_content="原智跑日志内容",
        )

        call_command("add_new_roster")

        self.assertEqual(xie.team_memberships.count(), 2)
        self.assertTrue(
            xie.team_memberships.filter(team__name="TEAM「清澜环」").exists()
        )
        existing_log.refresh_from_db()
        self.assertEqual(existing_log.team, smart_run)
        self.assertEqual(existing_log.work_content, "原智跑日志内容")
        new_team_logs = DailyLog.objects.filter(
            team__name="TEAM「清澜环」",
            student=xie,
        )
        self.assertEqual(new_team_logs.count(), 5)
        self.assertEqual(list(new_team_logs.values_list("day", flat=True)), [1, 2, 3, 4, 5])
        self.assertTrue(all(not log.is_complete for log in new_team_logs))

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
