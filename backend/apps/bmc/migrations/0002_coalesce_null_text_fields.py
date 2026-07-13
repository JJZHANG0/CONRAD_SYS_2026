from django.db import migrations

from apps.bmc.models import BMC_FIELDS


def coalesce_null_text_fields(apps, schema_editor):
    LeanCanvas = apps.get_model("bmc", "LeanCanvas")
    for canvas in LeanCanvas.objects.all().iterator():
        changed = False
        for field in BMC_FIELDS:
            if getattr(canvas, field) is None:
                setattr(canvas, field, "")
                changed = True
        if changed:
            canvas.save(update_fields=BMC_FIELDS)


class Migration(migrations.Migration):
    dependencies = [
        ("bmc", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(coalesce_null_text_fields, migrations.RunPython.noop),
    ]
