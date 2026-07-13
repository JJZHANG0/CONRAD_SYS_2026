from django.db import migrations

from apps.briefs.models import BRIEF_FIELDS


def coalesce_null_text_fields(apps, schema_editor):
    InnovationBrief = apps.get_model("briefs", "InnovationBrief")
    for brief in InnovationBrief.objects.all().iterator():
        changed = False
        for field in BRIEF_FIELDS:
            if getattr(brief, field) is None:
                setattr(brief, field, "")
                changed = True
        if changed:
            brief.save(update_fields=BRIEF_FIELDS)


class Migration(migrations.Migration):
    dependencies = [
        ("briefs", "0002_rename_brief_fields"),
    ]

    operations = [
        migrations.RunPython(coalesce_null_text_fields, migrations.RunPython.noop),
    ]
