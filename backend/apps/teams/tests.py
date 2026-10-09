from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

from apps.logs.models import DailyLog
from apps.bmc.models import LeanCanvas
from apps.briefs.models import InnovationBrief

from .models import Team, TeacherDailyEvaluation, TeamMember

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

    def test_co_teacher_sees_team_and_combined_teacher_names(self):
        self.other_teacher.display_name = "副老师"
        self.other_teacher.save(update_fields=["display_name"])
        self.team.co_teachers.add(self.other_teacher)

        self.client.force_authenticate(self.other_teacher)
        response = self.client.get(reverse("dashboard"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["teams"]), 1)
        self.assertEqual(
            response.data["teams"][0]["teacher_name"],
            f"{self.teacher.display_name} / 副老师",
        )

    def test_operations_co_teacher_is_flagged_on_team_detail(self):
        self.team.co_teachers.add(self.operations)
        self.client.force_authenticate(self.operations)

        response = self.client.get(reverse("team-detail", args=[self.team.id]))

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["viewer_is_team_teacher"])
        self.assertEqual(
            [item["id"] for item in response.data["co_teachers"]],
            [self.operations.id],
        )


class StudentMultipleTeamsTests(APITestCase):
    def setUp(self):
        self.teacher = User.objects.create_user(
            username="multi-team-teacher",
            email="multi-team-teacher@example.com",
            password="test-password",
            role=User.Role.TEACHER,
            display_name="多队老师",
        )
        self.student = User.objects.create_user(
            username="multi-team-student",
            email="multi-team-student@example.com",
            password="test-password",
            role=User.Role.STUDENT,
            display_name="多队学生",
        )
        self.first_team = Team.objects.create(
            name="First Team",
            teacher=self.teacher,
        )
        self.second_team = Team.objects.create(
            name="Second Team",
            teacher=self.teacher,
        )
        TeamMember.objects.create(team=self.first_team, student=self.student)
        TeamMember.objects.create(team=self.second_team, student=self.student)
        self.first_log = DailyLog.objects.create(
            team=self.first_team,
            student=self.student,
            day=1,
            work_content="first team work",
        )
        self.second_log = DailyLog.objects.create(
            team=self.second_team,
            student=self.student,
            day=1,
            work_content="second team work",
        )
        self.client.force_authenticate(self.student)

    def test_dashboard_and_team_list_include_both_teams(self):
        dashboard = self.client.get(reverse("dashboard"))
        team_list = self.client.get(reverse("team-list"))

        self.assertEqual(dashboard.status_code, 200)
        self.assertEqual(
            {team["id"] for team in dashboard.data["teams"]},
            {self.first_team.id, self.second_team.id},
        )
        self.assertEqual(
            {team["id"] for team in team_list.data},
            {self.first_team.id, self.second_team.id},
        )

    def test_my_logs_are_isolated_by_team(self):
        response = self.client.get(
            reverse("my-logs"),
            {"team": self.second_team.id},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual([log["id"] for log in response.data], [self.second_log.id])


class TeamProductLinksTests(APITestCase):
    def setUp(self):
        self.operations = User.objects.create_user(
            username="ops-links",
            email="ops-links@example.com",
            password="test-password",
            role=User.Role.OPERATIONS,
        )
        self.teacher = User.objects.create_user(
            username="teacher-links",
            email="teacher-links@example.com",
            password="test-password",
            role=User.Role.TEACHER,
        )
        self.other_teacher = User.objects.create_user(
            username="other-teacher-links",
            email="other-teacher-links@example.com",
            password="test-password",
            role=User.Role.TEACHER,
        )
        self.student = User.objects.create_user(
            username="student-links",
            email="student-links@example.com",
            password="test-password",
            role=User.Role.STUDENT,
        )
        self.team = Team.objects.create(name="Product Links Team", teacher=self.teacher)
        TeamMember.objects.create(team=self.team, student=self.student)
        self.url = reverse("team-product-links", args=[self.team.id])

    def test_operations_can_save_product_links(self):
        self.client.force_authenticate(self.operations)
        response = self.client.patch(
            self.url,
            {
                "product_website_url": "https://example.com/product",
                "product_video_url": "https://video.example.com/demo",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.team.refresh_from_db()
        self.assertEqual(self.team.product_website_url, "https://example.com/product")
        self.assertEqual(self.team.product_video_url, "https://video.example.com/demo")

    def test_assigned_teacher_can_update_and_clear_links(self):
        self.team.product_website_url = "https://old.example.com"
        self.team.save(update_fields=["product_website_url"])
        self.client.force_authenticate(self.teacher)

        response = self.client.patch(
            self.url,
            {"product_website_url": "", "product_video_url": "https://example.com/video"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.team.refresh_from_db()
        self.assertEqual(self.team.product_website_url, "")
        self.assertEqual(self.team.product_video_url, "https://example.com/video")

    def test_unassigned_teacher_and_student_cannot_edit_links(self):
        for user in (self.other_teacher, self.student):
            self.client.force_authenticate(user)
            response = self.client.patch(
                self.url,
                {"product_website_url": "https://forbidden.example.com"},
                format="json",
            )
            self.assertEqual(response.status_code, 403)

    def test_dashboard_and_detail_include_product_links(self):
        self.team.product_website_url = "https://example.com/product"
        self.team.product_video_url = "https://example.com/video"
        self.team.save(update_fields=["product_website_url", "product_video_url"])
        self.client.force_authenticate(self.student)

        dashboard = self.client.get(reverse("dashboard"))
        detail = self.client.get(reverse("team-detail", args=[self.team.id]))

        self.assertEqual(dashboard.status_code, 200)
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(dashboard.data["teams"][0]["product_website_url"], "https://example.com/product")
        self.assertEqual(dashboard.data["teams"][0]["product_video_url"], "https://example.com/video")
        self.assertEqual(detail.data["product_website_url"], "https://example.com/product")
        self.assertEqual(detail.data["product_video_url"], "https://example.com/video")


class TeamContentLocksTests(APITestCase):
    def setUp(self):
        self.operations = User.objects.create_user(
            username="ops-locks",
            email="ops-locks@example.com",
            password="test-password",
            role=User.Role.OPERATIONS,
        )
        self.teacher = User.objects.create_user(
            username="teacher-locks",
            email="teacher-locks@example.com",
            password="test-password",
            role=User.Role.TEACHER,
        )
        self.student = User.objects.create_user(
            username="student-locks",
            email="student-locks@example.com",
            password="test-password",
            role=User.Role.STUDENT,
        )
        self.team = Team.objects.create(name="Finalized Team", teacher=self.teacher)
        TeamMember.objects.create(team=self.team, student=self.student)
        self.canvas = LeanCanvas.objects.create(team=self.team, problem="原 BMC 内容")
        self.brief = InnovationBrief.objects.create(team=self.team, opportunity="原 IB 内容")
        self.lock_url = reverse("team-content-locks", args=[self.team.id])
        self.bmc_url = reverse("lean-canvas", args=[self.team.id])
        self.brief_url = reverse("innovation-brief", args=[self.team.id])

    def test_only_operations_can_change_content_locks(self):
        self.client.force_authenticate(self.teacher)
        denied = self.client.patch(
            self.lock_url,
            {"bmc_locked": True},
            format="json",
        )
        self.assertEqual(denied.status_code, 403)

        self.client.force_authenticate(self.operations)
        response = self.client.patch(
            self.lock_url,
            {"bmc_locked": True, "innovation_brief_locked": True},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.team.refresh_from_db()
        self.assertTrue(self.team.bmc_locked)
        self.assertTrue(self.team.innovation_brief_locked)

    def test_locked_documents_reject_teacher_and_student_edits(self):
        self.team.bmc_locked = True
        self.team.innovation_brief_locked = True
        self.team.save(update_fields=["bmc_locked", "innovation_brief_locked"])

        self.client.force_authenticate(self.teacher)
        bmc_response = self.client.patch(
            self.bmc_url,
            {"problem": "不应保存"},
            format="json",
        )
        self.client.force_authenticate(self.student)
        brief_response = self.client.patch(
            self.brief_url,
            {"opportunity": "不应保存"},
            format="json",
        )

        self.assertEqual(bmc_response.status_code, 423)
        self.assertEqual(brief_response.status_code, 423)
        self.canvas.refresh_from_db()
        self.brief.refresh_from_db()
        self.assertEqual(self.canvas.problem, "原 BMC 内容")
        self.assertEqual(self.brief.opportunity, "原 IB 内容")

    def test_lock_state_is_visible_in_documents_dashboard_and_detail(self):
        self.team.bmc_locked = True
        self.team.innovation_brief_locked = True
        self.team.save(update_fields=["bmc_locked", "innovation_brief_locked"])
        self.client.force_authenticate(self.operations)

        bmc = self.client.get(self.bmc_url)
        brief = self.client.get(self.brief_url)
        dashboard = self.client.get(reverse("dashboard"))
        detail = self.client.get(reverse("team-detail", args=[self.team.id]))

        self.assertTrue(bmc.data["is_locked"])
        self.assertTrue(brief.data["is_locked"])
        self.assertTrue(dashboard.data["teams"][0]["bmc_locked"])
        self.assertTrue(dashboard.data["teams"][0]["innovation_brief_locked"])
        self.assertTrue(detail.data["bmc_locked"])
        self.assertTrue(detail.data["innovation_brief_locked"])

    def test_operations_can_unlock_documents(self):
        self.team.bmc_locked = True
        self.team.save(update_fields=["bmc_locked"])
        self.client.force_authenticate(self.operations)

        response = self.client.patch(
            self.lock_url,
            {"bmc_locked": False},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.team.refresh_from_db()
        self.assertFalse(self.team.bmc_locked)
