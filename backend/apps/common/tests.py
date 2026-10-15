from django.contrib.auth import get_user_model
from django.test import Client, TestCase

from apps.bmc.models import LeanCanvas
from apps.bmc.serializers import LeanCanvasSerializer
from apps.briefs.models import InnovationBrief
from apps.briefs.serializers import InnovationBriefSerializer
from apps.teams.models import Team

User = get_user_model()


class PartialFormUpdateTests(TestCase):
    def setUp(self):
        teacher = User.objects.create_user(
            username="form-concurrency-teacher",
            email="form-concurrency@example.com",
            password="test-password",
            role=User.Role.TEACHER,
        )
        self.team = Team.objects.create(
            name="Form Concurrency Team",
            teacher=teacher,
        )

    def test_stale_bmc_instances_preserve_different_module_updates(self):
        canvas = LeanCanvas.objects.create(team=self.team)
        first = LeanCanvas.objects.get(pk=canvas.pk)
        second = LeanCanvas.objects.get(pk=canvas.pk)

        one = LeanCanvasSerializer(
            first, data={"problem": "<p>problem update</p>"}, partial=True
        )
        one.is_valid(raise_exception=True)
        one.save()
        two = LeanCanvasSerializer(
            second, data={"solution": "<p>solution update</p>"}, partial=True
        )
        two.is_valid(raise_exception=True)
        two.save()

        canvas.refresh_from_db()
        self.assertEqual(canvas.problem, "<p>problem update</p>")
        self.assertEqual(canvas.solution, "<p>solution update</p>")

    def test_stale_brief_instances_preserve_different_module_updates(self):
        brief = InnovationBrief.objects.create(team=self.team)
        first = InnovationBrief.objects.get(pk=brief.pk)
        second = InnovationBrief.objects.get(pk=brief.pk)

        one = InnovationBriefSerializer(
            first, data={"opportunity": "<p>opportunity update</p>"}, partial=True
        )
        one.is_valid(raise_exception=True)
        one.save()
        two = InnovationBriefSerializer(
            second, data={"market": "<p>market update</p>"}, partial=True
        )
        two.is_valid(raise_exception=True)
        two.save()

        brief.refresh_from_db()
        self.assertEqual(brief.opportunity, "<p>opportunity update</p>")
        self.assertEqual(brief.market, "<p>market update</p>")

    def test_brief_save_keeps_line_and_paragraph_breaks(self):
        from apps.common.text import sanitize_rich_text_html

        raw = "<div>First line</div><div><br></div><div>Second paragraph</div>"
        expected = "<p>First line</p><p><br></p><p>Second paragraph</p>"
        self.assertEqual(sanitize_rich_text_html(raw), expected)
        self.assertEqual(sanitize_rich_text_html(expected), expected)
        self.assertEqual(
            sanitize_rich_text_html("<p>line1<br>line2</p>"),
            "<p>line1</p><p>line2</p>",
        )
        self.assertEqual(
            sanitize_rich_text_html("<p>a <script>alert(1)</script> b</p>"),
            "<p>a b</p>",
        )
        self.assertEqual(
            sanitize_rich_text_html("a < b & c"),
            "<p>a &lt; b &amp; c</p>",
        )

        brief = InnovationBrief.objects.create(team=self.team)
        saved = InnovationBriefSerializer(
            brief, data={"opportunity": raw}, partial=True
        )
        saved.is_valid(raise_exception=True)
        saved.save()
        brief.refresh_from_db()
        self.assertEqual(brief.opportunity, expected)


class HealthCheckTests(TestCase):
    def test_health_check_probes_database(self):
        response = Client().get("/api/health/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")
        self.assertEqual(response.json()["database"], "sqlite")
