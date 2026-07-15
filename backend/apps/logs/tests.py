from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

from apps.teams.models import Team

from .models import DailyLog
from .serializers import StudentLogUpdateSerializer, TeacherCommentUpdateSerializer

User = get_user_model()


class DailyLogSaveTests(APITestCase):
    def setUp(self):
        self.teacher = User.objects.create_user(
            username="teacher-save-test",
            email="teacher-save@example.com",
            password="test-password",
            role=User.Role.TEACHER,
        )
        self.student = User.objects.create_user(
            username="student-save-test",
            email="student-save@example.com",
            password="test-password",
            role=User.Role.STUDENT,
        )
        self.team = Team.objects.create(
            name="Save Test Team",
            teacher=self.teacher,
        )
        self.log = DailyLog.objects.create(
            team=self.team,
            student=self.student,
            day=1,
        )
        self.url = reverse("log-update", args=[self.log.id])

    def test_student_single_field_patch_does_not_overwrite_other_fields(self):
        self.log.task_completion = "<p>keep this plan</p>"
        self.log.save()
        self.client.force_authenticate(self.student)

        response = self.client.patch(
            self.url,
            {"work_content": "<p>new work</p>"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.log.refresh_from_db()
        self.assertEqual(self.log.work_content, "<p>new work</p>")
        self.assertEqual(self.log.task_completion, "<p>keep this plan</p>")

    def test_student_input_is_sanitized_and_null_safe(self):
        self.client.force_authenticate(self.student)

        response = self.client.patch(
            self.url,
            {
                "work_content": '<span class="css-junk" data-copy="x">safe text</span>',
                "reflection": None,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.log.refresh_from_db()
        self.assertEqual(self.log.work_content, "<p>safe text</p>")
        self.assertEqual(self.log.reflection, "")

    def test_teacher_comment_updates_without_touching_student_content(self):
        self.log.work_content = "<p>student work</p>"
        self.log.save()
        self.client.force_authenticate(self.teacher)

        response = self.client.patch(
            self.url,
            {"teacher_comment": "<p>Good progress</p>"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.log.refresh_from_db()
        self.assertEqual(self.log.work_content, "<p>student work</p>")
        self.assertEqual(self.log.teacher_comment, "<p>Good progress</p>")
        self.assertIsNotNone(self.log.teacher_comment_updated_at)

    def test_stale_student_and_teacher_instances_do_not_overwrite_each_other(self):
        student_copy = DailyLog.objects.get(pk=self.log.pk)
        teacher_copy = DailyLog.objects.get(pk=self.log.pk)

        student_serializer = StudentLogUpdateSerializer(
            student_copy,
            data={"work_content": "<p>student concurrent save</p>"},
            partial=True,
        )
        student_serializer.is_valid(raise_exception=True)
        student_serializer.save()

        teacher_serializer = TeacherCommentUpdateSerializer(
            teacher_copy,
            data={"teacher_comment": "<p>teacher concurrent save</p>"},
            partial=True,
        )
        teacher_serializer.is_valid(raise_exception=True)
        teacher_serializer.save()

        self.log.refresh_from_db()
        self.assertEqual(
            self.log.work_content, "<p>student concurrent save</p>"
        )
        self.assertEqual(
            self.log.teacher_comment, "<p>teacher concurrent save</p>"
        )
