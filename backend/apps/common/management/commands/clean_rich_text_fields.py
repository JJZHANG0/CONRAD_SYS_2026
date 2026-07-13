from django.core.management.base import BaseCommand

from apps.bmc.models import BMC_FIELDS, LeanCanvas
from apps.briefs.models import BRIEF_FIELDS, InnovationBrief
from apps.common.text import sanitize_rich_text_html


class Command(BaseCommand):
    help = "Strip Feishu/Notion clipboard junk from Brief and BMC text fields."

    def handle(self, *args, **options):
        models = [
            (InnovationBrief, BRIEF_FIELDS, "briefs"),
            (LeanCanvas, BMC_FIELDS, "bmc"),
        ]
        for model, fields, label in models:
            fixed = 0
            for row in model.objects.all().iterator():
                changed = False
                for field in fields:
                    raw = getattr(row, field) or ""
                    cleaned = sanitize_rich_text_html(raw)
                    if cleaned != raw:
                        setattr(row, field, cleaned)
                        changed = True
                if changed:
                    row.save(update_fields=list(fields))
                    fixed += 1
            self.stdout.write(self.style.SUCCESS(f"{label}: cleaned {fixed} row(s)"))
