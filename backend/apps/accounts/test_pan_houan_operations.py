from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from apps.teams.models import Team


User = get_user_model()


class AddPanHouanOperationsCommandTests(TestCase):
    def setUp(self):
        self.teacher = User.objects.create_user(
            username="team-teacher",
            password="existing-password",
            email="team-teacher@example.com",
            role=User.Role.TEACHER,
            display_name="队伍教练",
        )
        self.teams = [
            Team.objects.create(name="第一队", teacher=self.teacher),
            Team.objects.create(name="第二队", teacher=self.teacher),
        ]

    def test_creates_idempotent_operations_account_with_all_team_access(self):
        call_command("add_pan_houan_operations")
        call_command("add_pan_houan_operations")

        user = User.objects.get(display_name="潘厚安")
        self.assertEqual(User.objects.filter(display_name="潘厚安").count(), 1)
        self.assertEqual(user.username, "ops_pan")
        self.assertEqual(user.role, User.Role.OPERATIONS)
        self.assertTrue(user.is_active)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.check_password("Conrad@2026!"))

        client = APIClient()
        client.force_authenticate(user)
        response = client.get(reverse("dashboard"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["role"], "operations")
        self.assertEqual(
            {team["id"] for team in response.data["teams"]},
            {team.id for team in self.teams},
        )

    def test_promotes_existing_account_without_changing_its_primary_key(self):
        existing = User.objects.create_user(
            username="teacher_pan",
            password="old-password",
            email="teacher-pan@example.com",
            role=User.Role.TEACHER,
            display_name="潘厚安",
        )
        original_id = existing.id

        call_command("add_pan_houan_operations")

        existing.refresh_from_db()
        self.assertEqual(existing.id, original_id)
        self.assertEqual(existing.username, "ops_pan")
        self.assertEqual(existing.role, User.Role.OPERATIONS)
        self.assertTrue(existing.check_password("Conrad@2026!"))
