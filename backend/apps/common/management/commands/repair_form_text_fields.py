from django.core.management.base import BaseCommand
from django.db import connection

from apps.bmc.models import BMC_FIELDS, LeanCanvas
from apps.briefs.models import BRIEF_FIELDS, InnovationBrief


class Command(BaseCommand):
    help = "Repair NULL text fields in Innovation Brief and Lean Canvas tables."

    def handle(self, *args, **options):
        tables = {
            "briefs_innovationbrief": (InnovationBrief, BRIEF_FIELDS),
            "bmc_leancanvas": (LeanCanvas, BMC_FIELDS),
        }
        with connection.cursor() as cursor:
            for table, (model, fields) in tables.items():
                cursor.execute(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name=%s",
                    [table],
                )
                if not cursor.fetchone():
                    self.stdout.write(self.style.WARNING(f"Skip missing table: {table}"))
                    continue

                fixed = 0
                for row in model.objects.all().iterator():
                    changed = False
                    for field in fields:
                        if getattr(row, field) is None:
                            setattr(row, field, "")
                            changed = True
                    if changed:
                        row.save(update_fields=list(fields))
                        fixed += 1
                self.stdout.write(self.style.SUCCESS(f"{table}: repaired {fixed} row(s)"))
