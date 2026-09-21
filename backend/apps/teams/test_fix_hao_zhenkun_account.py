from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase

from apps.teams.models import Team


User = get_user_model()


class FixHaoZhenkunAccountCommandTests(TestCase):
    def test_corrects_account_in_place_and_is_idempotent(self):
        teacher = User.objects.create_user(
            username="teacher_haozhenyu",
            password="old-password",
            email="teacher_haozhenyu@conrad.local",
            role=User.Role.TEACHER,
            display_name="郝震煜",
        )
        team = Team.objects.create(
            name="TEAM「隼卫」",
            project_name="隼卫",
            teacher=teacher,
        )

        call_command("fix_hao_zhenkun_account")
        call_command("fix_hao_zhenkun_account")

        teacher.refresh_from_db()
        team.refresh_from_db()
        self.assertEqual(teacher.pk, team.teacher_id)
        self.assertEqual(teacher.username, "teacher_haozhenkun")
        self.assertEqual(teacher.display_name, "郝震焜")
        self.assertEqual(teacher.email, "teacher_haozhenkun@conrad.local")
        self.assertTrue(teacher.is_active)
        self.assertTrue(teacher.check_password("Conrad@2026!"))
        self.assertEqual(User.objects.count(), 1)
