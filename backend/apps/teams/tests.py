from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

from .models import Team, TeacherDailyEvaluation

User = get_user_model()


class TeacherDailyEvaluationTests(APITestCase):
    def setUp(self):
        self.operations = User.objects.create_user(
            username="ops-evaluation",
            email="ops-evaluation@example.com",
            password="test-password",
            role=User.Role.OPERATIONS,
        )
        self.teacher = User.objects.create_user(
            username="teacher-evaluation",
            email="teacher-evaluation@example.com",
            password="test-password",
            role=User.Role.TEACHER,
        )
        self.other_teacher = User.objects.create_user(
            username="other-teacher-evaluation",
            email="other-teacher-evaluation@example.com",
            password="test-password",
            role=User.Role.TEACHER,
        )
        self.student = User.objects.create_user(
            username="student-evaluation",
            email="student-evaluation@example.com",
            password="test-password",
            role=User.Role.STUDENT,
        )
        self.team = Team.objects.create(
            name="Evaluation Team",
            teacher=self.teacher,
        )
        self.list_url = reverse(
            "teacher-evaluation-list",
            args=[self.team.id],
        )
        self.day_url = reverse(
            "teacher-evaluation-update",
            args=[self.team.id, 1],
        )

    def test_operations_can_score_and_comment_on_a_day(self):
        self.client.force_authenticate(self.operations)

        response = self.client.patch(
            self.day_url,
            {
                "business_duration": True,
                "business_correction": True,
                "engineering_duration": True,
                "comment": "今天指导及时，日志反馈还可以更具体。",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["business_score"], 2)
        self.assertEqual(response.data["engineering_score"], 1)
        self.assertEqual(response.data["total_score"], 3)
        evaluation = TeacherDailyEvaluation.objects.get(team=self.team, day=1)
        self.assertEqual(evaluation.reviewed_by, self.operations)
        self.assertEqual(evaluation.comment, "")

    def test_only_day_five_accepts_the_overall_comment(self):
        self.client.force_authenticate(self.operations)
        day_five_url = reverse(
            "teacher-evaluation-update",
            args=[self.team.id, 5],
        )

        response = self.client.patch(
            day_five_url,
            {"comment": "五天整体指导认真，后续可以加强跨组协作。"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["comment"],
            "五天整体指导认真，后续可以加强跨组协作。",
        )

    def test_assigned_teacher_can_view_but_cannot_edit(self):
        TeacherDailyEvaluation.objects.create(
            team=self.team,
            day=1,
            business_duration=True,
            comment="只读评语",
            reviewed_by=self.operations,
        )
        self.client.force_authenticate(self.teacher)

        list_response = self.client.get(self.list_url)
        update_response = self.client.patch(
            self.day_url,
            {"business_duration": False},
            format="json",
        )

        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(list_response.data[0]["total_score"], 1)
        self.assertEqual(update_response.status_code, 403)

    def test_unassigned_teacher_and_student_cannot_view(self):
        for user in (self.other_teacher, self.student):
            self.client.force_authenticate(user)
            response = self.client.get(self.list_url)
            self.assertEqual(response.status_code, 403)

    def test_dashboard_includes_five_day_score_summary(self):
        TeacherDailyEvaluation.objects.create(
            team=self.team,
            day=1,
            business_duration=True,
            engineering_duration=True,
            reviewed_by=self.operations,
        )
        TeacherDailyEvaluation.objects.create(
            team=self.team,
            day=2,
            business_duration=True,
            business_correction=True,
            engineering_duration=True,
            reviewed_by=self.operations,
        )
        self.client.force_authenticate(self.teacher)

        response = self.client.get(reverse("dashboard"))

        self.assertEqual(response.status_code, 200)
        team_data = response.data["teams"][0]
        self.assertEqual(team_data["teacher_score_total"], 5)
        self.assertEqual(team_data["teacher_score_max"], 50)
        self.assertEqual(team_data["teacher_score_days"], 2)
