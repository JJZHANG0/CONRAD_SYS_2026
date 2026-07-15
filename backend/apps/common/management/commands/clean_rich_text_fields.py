from apps.bmc.models import BMC_FIELDS, LeanCanvas
from apps.briefs.models import BRIEF_FIELDS, InnovationBrief
from apps.logs.models import DailyLog
from apps.common.text import sanitize_rich_text_html
from django.core.management.base import BaseCommand

LOG_FIELDS = ["work_content", "task_completion", "problems_solutions", "reflection", "teacher_comment"]


class Command(BaseCommand):
    help = "Strip Feishu/Notion clipboard junk from Brief, BMC, and Daily Log text fields."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report dirty rows without changing the database.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        models = [
            (InnovationBrief, BRIEF_FIELDS, "briefs"),
            (LeanCanvas, BMC_FIELDS, "bmc"),
        ]
        for model, fields, label in models:
            fixed = 0
            for row in model.objects.all().iterator():
                changed_fields = []
                for field in fields:
                    raw = getattr(row, field) or ""
                    cleaned = sanitize_rich_text_html(raw)
                    if cleaned != raw:
                        setattr(row, field, cleaned)
                        changed_fields.append(field)
                if changed_fields:
                    if not dry_run:
                        row.save(update_fields=changed_fields)
                    fixed += 1
            action = "would clean" if dry_run else "cleaned"
            self.stdout.write(self.style.SUCCESS(f"{label}: {action} {fixed} row(s)"))

        log_fixed = 0
        for log in DailyLog.objects.all().iterator():
            changed_fields = []
            for field in LOG_FIELDS:
                raw = getattr(log, field) or ""
                cleaned = sanitize_rich_text_html(raw)
                if cleaned != raw:
                    setattr(log, field, cleaned)
                    changed_fields.append(field)
            if changed_fields:
                if not dry_run:
                    log.save(update_fields=changed_fields)
                log_fixed += 1
        action = "would clean" if dry_run else "cleaned"
        self.stdout.write(
            self.style.SUCCESS(f"logs: {action} {log_fixed} dirty/NULL row(s)")
        )
