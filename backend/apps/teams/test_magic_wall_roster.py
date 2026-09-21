from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase

from apps.bmc.models import LeanCanvas
from apps.briefs.models import InnovationBrief
from apps.logs.models import DailyLog

from .models import Team, TeamMember

User = get_user_model()


class AddMagicWallRosterTests(TestCase):
    def setUp(self):
        self.teacher_zhang = User.objects.create_user(
            username="teacher_001",
            email="teacher_001@example.com",
            password="existing-password",
            role=User.Role.TEACHER,
            display_name="张捷嘉",
        )
        self.old_xun_teacher = User.objects.create_user(
            username="teacher_003",
            email="teacher_003@example.com",
            password="existing-password",
            role=User.Role.TEACHER,
            display_name="夏宏伟",
        )
        self.operations_cheng = User.objects.create_user(
            username="ops_cheng",
            email="ops_cheng@example.com",
            password="existing-password",
            role=User.Role.OPERATIONS,
            display_name="程雪晴",
        )
        self.operations_zhang = User.objects.create_user(
            username="ops_zhang",
            email="ops_zhang@example.com",
            password="existing-password",
            role=User.Role.OPERATIONS,
            display_name="张雪航",
        )
        self.xun = Team.objects.create(
            name="TEAM「埙」",
            project_name="埙",
            challenge_category="Health & Nutrition",
            teacher=self.old_xun_teacher,
        )
        self.xun_canvas = LeanCanvas.objects.create(
            team=self.xun,
            problem="原有埙 BMC 内容",
        )

    def test_command_is_complete_idempotent_and_preserves_xun_content(self):
        for _ in range(2):
            call_command(
                "add_magic_wall_roster",
                challenge_category="Cyber-Technology & Security",
            )

        magic_wall = Team.objects.get(name="TEAM「魔术墙」")
        self.xun.refresh_from_db()
        self.xun_canvas.refresh_from_db()
        luo = User.objects.get(display_name="罗超")

        self.assertEqual(magic_wall.teacher, self.teacher_zhang)
        self.assertEqual(
            magic_wall.challenge_category,
            "Cyber-Technology & Security",
        )
        self.assertTrue(
            magic_wall.co_teachers.filter(pk=self.operations_cheng.pk).exists()
        )
        self.assertEqual(magic_wall.members.count(), 5)
        self.assertEqual(
            set(magic_wall.members.values_list("student__display_name", flat=True)),
            {"范馨文", "田晨瑞", "彭俊霖", "黄启睿", "Leo Su"},
        )
        self.assertEqual(
            DailyLog.objects.filter(team=magic_wall).count(),
            25,
        )
        self.assertFalse(
            DailyLog.objects.filter(team=magic_wall, work_content__gt="").exists()
        )
        self.assertEqual(LeanCanvas.objects.filter(team=magic_wall).count(), 1)
        self.assertEqual(
            InnovationBrief.objects.filter(team=magic_wall).count(),
            1,
        )

        self.assertEqual(self.xun.teacher, luo)
        self.assertTrue(
            self.xun.co_teachers.filter(pk=self.operations_zhang.pk).exists()
        )
        self.assertEqual(self.xun_canvas.problem, "原有埙 BMC 内容")
        self.assertTrue(luo.check_password("Conrad@2026!"))
        self.assertEqual(TeamMember.objects.filter(team=magic_wall).count(), 5)
